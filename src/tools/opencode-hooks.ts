/**
 * OpenCode MCP Server - Stop Hook 工具集
 * 任务完成自动回调：派发任务、读取结果、读取唤醒文件
 *
 * 功能描述：
 * - opencode_hook_dispatch: 通过 OpenCode CLI 派发任务，写入 task-meta.json
 * - opencode_hook_result:   读取 Stop Hook 写入的最新结果（latest.json）
 * - opencode_hook_wake:     读取/处理 pending-wake.json 供 AGI 主会话集成
 *
 * 跨平台支持：Windows / Linux / macOS
 * - 所有文件操作使用 Node.js fs/path，不依赖 shell 脚本
 * - 路径拼接使用 path.join / path.resolve 兼容不同操作系统
 * - 默认目录基于 os.homedir() 自动适配
 *
 * 设计模式：策略模式 + 接口隔离原则
 * 每个工具独立实现 ToolDefinition 接口，通过 ToolRegistry 统一管理
 *
 * @author shichao.han
 * @version 1.1.0
 * @date 2026/03/04 14:37
 */

import { z } from 'zod';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { type ToolDefinition, type ToolResult } from '../tool-definition.js';
import { type CommandExecutor } from '../executor.js';

/* ============================================================
 * 内部辅助：跨平台路径与文件操作
 * ============================================================ */

/**
 * 获取 Hook 结果文件目录（跨平台）
 * 优先级：环境变量 HOOK_RESULT_DIR > 用户主目录下默认路径
 *
 * - Windows: C:\Users\<user>\opencode-data\hook-results
 * - Linux/macOS: /home/<user>/opencode-data/hook-results
 *
 * @returns Hook 结果目录的绝对路径
 */
function getResultDir(): string {
    return resolve(
        process.env['HOOK_RESULT_DIR']
        ?? join(homedir(), 'opencode-data', 'hook-results'),
    );
}

/**
 * 安全读取 JSON 文件（跨平台）
 * 文件不存在或解析失败时返回 null 而非抛出异常
 *
 * @param filePath - JSON 文件的绝对路径
 * @returns 解析后的 JSON 对象，或 null（文件不存在/解析失败）
 */
async function safeReadJson(filePath: string): Promise<Record<string, unknown> | null> {
    try {
        if (!existsSync(filePath)) {
            return null;
        }
        const content = await readFile(filePath, 'utf-8');
        return JSON.parse(content) as Record<string, unknown>;
    } catch {
        return null;
    }
}

/**
 * 安全写入 JSON 文件（跨平台，自动创建目录）
 *
 * @param filePath - JSON 文件的绝对路径
 * @param data - 要写入的数据对象
 */
async function safeWriteJson(filePath: string, data: Record<string, unknown>): Promise<void> {
    const dir = resolve(filePath, '..');
    await mkdir(dir, { recursive: true });
    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

/* ============================================================
 * opencode_hook_dispatch — 通过 OpenCode CLI 派发任务
 * 写入 task-meta.json 并使用 executor 执行 OpenCode
 * ============================================================ */

/** dispatch 输入参数 Schema */
const dispatchSchema = z.object({
    prompt: z.string().min(1).describe('Task prompt/instruction for OpenCode AI'),
    task_name: z.string().optional().describe('Task name for tracking (default: auto-generated)'),
    group: z.string().optional().describe('Chat group ID for result notification'),
    workspace: z.string().optional().describe('Working directory for OpenCode'),
    model: z.string().optional().describe('Override LLM model identifier'),
    quiet: z.boolean().optional().default(true).describe('Suppress spinner animation (default: true)'),
});

/**
 * opencode_hook_dispatch 工具实现
 * 通过 OpenCode CLI 派发 AI 编码任务，并写入元数据供 Hook 回调使用
 *
 * 流程：
 * 1. 生成 task-meta.json（任务名、目标群组等元数据）
 * 2. 调用 OpenCode CLI 执行 prompt
 * 3. 任务完成后写入 latest.json 结果文件
 *
 * 跨平台：完全使用 Node.js fs + CommandExecutor，无 shell 依赖
 */
export const opencodeHookDispatchTool: ToolDefinition = {
    name: 'opencode_hook_dispatch',
    description:
        'Dispatch a task to OpenCode CLI with auto-callback on completion. ' +
        'Writes task metadata (task-meta.json), executes the prompt via OpenCode, ' +
        'and writes result/wake files when the task finishes. ' +
        'Cross-platform: works on Windows, Linux, and macOS.',

    getInputSchema() {
        return {
            type: 'object',
            properties: {
                prompt: { type: 'string', description: 'Task prompt/instruction for OpenCode AI', minLength: 1 },
                task_name: { type: 'string', description: 'Task name for tracking (default: auto-generated)' },
                group: { type: 'string', description: 'Chat group ID for result notification' },
                workspace: { type: 'string', description: 'Working directory for OpenCode' },
                model: { type: 'string', description: 'Override LLM model identifier' },
                quiet: { type: 'boolean', description: 'Suppress spinner animation (default: true)', default: true },
            },
            required: ['prompt'],
        };
    },

    async execute(executor: CommandExecutor, args: Record<string, unknown>): Promise<ToolResult> {
        const parsed = dispatchSchema.parse(args);
        const resultDir = getResultDir();
        const taskName = parsed.task_name ?? `task-${Date.now()}`;

        // 1. 写入任务元数据（跨平台 Node.js fs）
        const metaFile = join(resultDir, 'task-meta.json');
        const meta: Record<string, unknown> = {
            task_name: taskName,
            group: parsed.group ?? '',
            prompt: parsed.prompt,
            workspace: parsed.workspace ?? '.',
            started_at: new Date().toISOString(),
            status: 'running',
        };

        try {
            await safeWriteJson(metaFile, meta);
        } catch {
            // 元数据写入失败不阻塞任务执行
        }

        // 2. 通过 CommandExecutor 执行 OpenCode CLI
        const result = await executor.runPrompt(parsed.prompt, {
            workspace: parsed.workspace,
            model: parsed.model,
            quiet: parsed.quiet,
        });

        // 3. 写入结果文件（latest.json）
        const resultData: Record<string, unknown> = {
            task_name: taskName,
            group: parsed.group ?? '',
            timestamp: new Date().toISOString(),
            output: result.stdout || '',
            exit_code: result.exitCode,
            status: result.success ? 'done' : 'failed',
        };

        try {
            await safeWriteJson(join(resultDir, 'latest.json'), resultData);
        } catch {
            // 结果写入失败不影响返回
        }

        // 4. 写入唤醒文件（pending-wake.json）
        if (result.success) {
            const wakeData: Record<string, unknown> = {
                task_name: taskName,
                group: parsed.group ?? '',
                timestamp: new Date().toISOString(),
                summary: (result.stdout || '').slice(0, 500),
                processed: false,
            };
            try {
                await safeWriteJson(join(resultDir, 'pending-wake.json'), wakeData);
            } catch {
                // 唤醒文件写入失败不影响返回
            }
        }

        // 5. 更新元数据状态
        try {
            await safeWriteJson(metaFile, {
                ...meta,
                status: result.success ? 'done' : 'failed',
                exit_code: result.exitCode,
                completed_at: new Date().toISOString(),
            });
        } catch {
            // 元数据更新失败不影响返回
        }

        if (result.success) {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        status: 'done',
                        task_name: taskName,
                        group: parsed.group ?? 'none',
                        result_dir: resultDir,
                        output: result.stdout || '(OpenCode completed with no output)',
                    }, null, 2),
                }],
            };
        }

        return {
            content: [{
                type: 'text',
                text: `OpenCode task dispatch failed (exit code: ${result.exitCode})\n${result.stderr}\n${result.stdout}`,
            }],
            isError: true,
        };
    },
};

/* ============================================================
 * opencode_hook_result — 读取 Stop Hook 结果
 * 读取 latest.json 获取最近一次任务完成结果
 * ============================================================ */

/** result 输入参数 Schema */
const resultSchema = z.object({
    result_dir: z.string().optional().describe('Override result directory path (default: HOOK_RESULT_DIR env or ~/opencode-data/hook-results)'),
    file_name: z.string().optional().default('latest.json').describe('Result file name (default: latest.json)'),
});

/**
 * opencode_hook_result 工具实现
 * 读取 OpenCode 任务完成后写入的最新结果文件
 *
 * 跨平台：使用 Node.js fs 读取，路径通过 path.join 拼接
 */
export const opencodeHookResultTool: ToolDefinition = {
    name: 'opencode_hook_result',
    description:
        'Read the latest OpenCode task result file (latest.json). ' +
        'Returns task completion data including task_name, timestamp, output, and status. ' +
        'The result file is written when an OpenCode task finishes via the dispatch tool or Stop Hook. ' +
        'Cross-platform: works on Windows, Linux, and macOS.',

    getInputSchema() {
        return {
            type: 'object',
            properties: {
                result_dir: { type: 'string', description: 'Override result directory path' },
                file_name: { type: 'string', description: 'Result file name (default: latest.json)', default: 'latest.json' },
            },
            required: [],
        };
    },

    async execute(_executor: CommandExecutor, args: Record<string, unknown>): Promise<ToolResult> {
        const parsed = resultSchema.parse(args);
        const resultDir = parsed.result_dir ? resolve(parsed.result_dir) : getResultDir();
        const filePath = join(resultDir, parsed.file_name ?? 'latest.json');

        const data = await safeReadJson(filePath);

        if (data === null) {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        status: 'not_found',
                        message: `No result file found at: ${filePath}`,
                        hint: 'No OpenCode task has completed yet, or the result directory is different.',
                    }, null, 2),
                }],
            };
        }

        return {
            content: [{
                type: 'text',
                text: JSON.stringify(data, null, 2),
            }],
        };
    },
};

/* ============================================================
 * opencode_hook_wake — 读取/处理 pending-wake 文件
 * 供 AGI 主会话读取唤醒标记
 * ============================================================ */

/** wake 输入参数 Schema */
const wakeSchema = z.object({
    result_dir: z.string().optional().describe('Override result directory path'),
    mark_processed: z.boolean().optional().default(false).describe('Mark the wake file as processed after reading (set processed=true)'),
});

/**
 * opencode_hook_wake 工具实现
 * 读取 pending-wake.json 并可选标记为已处理
 *
 * 跨平台：使用 Node.js fs 操作，路径通过 path.join 拼接
 */
export const opencodeHookWakeTool: ToolDefinition = {
    name: 'opencode_hook_wake',
    description:
        'Read the pending-wake.json file written after an OpenCode task completes, for AGI session integration. ' +
        'Returns wake data including task_name, summary, and processed status. ' +
        'Optionally marks the wake file as processed to prevent duplicate handling. ' +
        'Cross-platform: works on Windows, Linux, and macOS.',

    getInputSchema() {
        return {
            type: 'object',
            properties: {
                result_dir: { type: 'string', description: 'Override result directory path' },
                mark_processed: { type: 'boolean', description: 'Mark as processed after reading (default: false)', default: false },
            },
            required: [],
        };
    },

    async execute(_executor: CommandExecutor, args: Record<string, unknown>): Promise<ToolResult> {
        const parsed = wakeSchema.parse(args);
        const resultDir = parsed.result_dir ? resolve(parsed.result_dir) : getResultDir();
        const filePath = join(resultDir, 'pending-wake.json');

        const data = await safeReadJson(filePath);

        if (data === null) {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        status: 'no_pending_wake',
                        message: `No pending-wake file found at: ${filePath}`,
                        hint: 'No OpenCode task has completed yet, or the wake file has already been consumed.',
                    }, null, 2),
                }],
            };
        }

        // 如果已经标记为已处理，返回状态说明
        if (data['processed'] === true) {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        ...data,
                        status: 'already_processed',
                        message: 'This wake event has already been processed.',
                    }, null, 2),
                }],
            };
        }

        // 可选：标记为已处理（跨平台 Node.js fs 写入）
        if (parsed.mark_processed) {
            try {
                const updatedData = { ...data, processed: true, processed_at: new Date().toISOString() };
                await safeWriteJson(filePath, updatedData);
            } catch {
                // 写入失败不影响读取结果
            }
        }

        return {
            content: [{
                type: 'text',
                text: JSON.stringify(data, null, 2),
            }],
        };
    },
};
