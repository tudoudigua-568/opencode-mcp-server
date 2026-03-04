/**
 * OpenCode MCP Server - Stop Hook 工具单元测试
 * 验证 opencode_hook_dispatch、opencode_hook_result、opencode_hook_wake 三个工具
 *
 * 测试覆盖：Zod schema 验证、成功/失败路径、文件读写、边界条件
 * 跨平台：测试使用 os.tmpdir() 和 Node.js fs，兼容 Windows / Linux / macOS
 *
 * @author shichao.han
 * @version 1.1.0
 * @date 2026/03/04 14:37
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { writeFile, mkdir, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { opencodeHookDispatchTool, opencodeHookResultTool, opencodeHookWakeTool } from '../tools/opencode-hooks.js';
import type { CommandExecutor } from '../executor.js';

/** 测试用临时目录（跨平台） */
let testDir: string;

/**
 * 创建 Mock CommandExecutor
 * 模拟成功或失败的 OpenCode CLI 执行
 */
function createMockExecutor(overrides?: Partial<{ stdout: string; stderr: string; exitCode: number; success: boolean }>): CommandExecutor {
    const defaults = { stdout: 'ok', stderr: '', exitCode: 0, success: true };
    const result = { ...defaults, ...overrides };
    return {
        execute: vi.fn().mockResolvedValue(result),
        runPrompt: vi.fn().mockResolvedValue(result),
        listModels: vi.fn().mockResolvedValue(result),
        listAuth: vi.fn().mockResolvedValue(result),
    } as unknown as CommandExecutor;
}

describe('opencode_hook_dispatch', () => {
    it('应有正确的工具名称和描述', () => {
        expect(opencodeHookDispatchTool.name).toBe('opencode_hook_dispatch');
        expect(opencodeHookDispatchTool.description).toContain('OpenCode');
        expect(opencodeHookDispatchTool.description).toContain('Cross-platform');
        expect(opencodeHookDispatchTool.description.length).toBeGreaterThan(10);
    });

    it('inputSchema 应为合法 JSON Schema', () => {
        const schema = opencodeHookDispatchTool.getInputSchema();
        expect(schema.type).toBe('object');
        expect(schema.properties).toBeDefined();
        expect(schema.required).toContain('prompt');
    });

    it('应成功派发 OpenCode 任务', async () => {
        const executor = createMockExecutor({ stdout: 'Hello World program created' });
        const result = await opencodeHookDispatchTool.execute(executor, {
            prompt: 'Write a hello world program',
            task_name: 'hello-world',
            group: '-12345',
        });

        expect(result.isError).toBeUndefined();
        const data = JSON.parse(result.content[0].text);
        expect(data.status).toBe('done');
        expect(data.task_name).toBe('hello-world');
        expect(data.group).toBe('-12345');

        // 验证调用了 runPrompt 而非 shell 脚本
        expect(executor.runPrompt).toHaveBeenCalledWith(
            'Write a hello world program',
            expect.objectContaining({ quiet: true }),
        );
    });

    it('应处理 OpenCode 执行失败', async () => {
        const executor = createMockExecutor({ exitCode: 1, success: false, stderr: 'Model not found' });
        const result = await opencodeHookDispatchTool.execute(executor, {
            prompt: 'Some task',
        });

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('dispatch failed');
    });

    it('应对空 prompt 抛出验证错误', async () => {
        const executor = createMockExecutor();
        await expect(
            opencodeHookDispatchTool.execute(executor, { prompt: '' }),
        ).rejects.toThrow();
    });

    it('应传递所有可选参数到 executor', async () => {
        const executor = createMockExecutor();
        const result = await opencodeHookDispatchTool.execute(executor, {
            prompt: 'Refactor the codebase',
            task_name: 'refactor-task',
            group: '-999',
            workspace: '/tmp/test-workspace',
            model: 'anthropic/claude-sonnet-4-20250514',
            quiet: false,
        });

        expect(result.isError).toBeUndefined();
        expect(executor.runPrompt).toHaveBeenCalledWith(
            'Refactor the codebase',
            expect.objectContaining({
                workspace: '/tmp/test-workspace',
                model: 'anthropic/claude-sonnet-4-20250514',
                quiet: false,
            }),
        );
    });

    it('应自动生成 task_name 如未指定', async () => {
        const executor = createMockExecutor();
        const result = await opencodeHookDispatchTool.execute(executor, {
            prompt: 'A quick task',
        });

        const data = JSON.parse(result.content[0].text);
        expect(data.task_name).toMatch(/^task-\d+$/);
    });
});

describe('opencode_hook_result', () => {
    beforeEach(async () => {
        testDir = join(tmpdir(), `opencode-hook-test-result-${Date.now()}`);
        await mkdir(testDir, { recursive: true });
    });

    afterEach(async () => {
        await rm(testDir, { recursive: true, force: true });
    });

    it('应有正确的工具名称', () => {
        expect(opencodeHookResultTool.name).toBe('opencode_hook_result');
        expect(opencodeHookResultTool.description).toContain('OpenCode');
        expect(opencodeHookResultTool.description).toContain('Cross-platform');
    });

    it('应读取 latest.json 内容', async () => {
        const mockData = {
            task_name: 'test-task',
            timestamp: '2026-03-04T14:00:00+08:00',
            output: 'Created hello.py',
            exit_code: 0,
            status: 'done',
        };
        await writeFile(join(testDir, 'latest.json'), JSON.stringify(mockData), 'utf-8');

        const executor = createMockExecutor();
        const result = await opencodeHookResultTool.execute(executor, {
            result_dir: testDir,
        });

        expect(result.isError).toBeUndefined();
        const data = JSON.parse(result.content[0].text);
        expect(data.task_name).toBe('test-task');
        expect(data.status).toBe('done');
        expect(data.exit_code).toBe(0);
    });

    it('文件不存在时应返回 not_found', async () => {
        const executor = createMockExecutor();
        const result = await opencodeHookResultTool.execute(executor, {
            result_dir: testDir,
        });

        expect(result.isError).toBeUndefined();
        const data = JSON.parse(result.content[0].text);
        expect(data.status).toBe('not_found');
        expect(data.hint).toContain('OpenCode');
    });

    it('应支持自定义文件名', async () => {
        await writeFile(join(testDir, 'custom.json'), JSON.stringify({ custom: true }), 'utf-8');

        const executor = createMockExecutor();
        const result = await opencodeHookResultTool.execute(executor, {
            result_dir: testDir,
            file_name: 'custom.json',
        });

        const data = JSON.parse(result.content[0].text);
        expect(data.custom).toBe(true);
    });

    it('inputSchema 应为合法格式', () => {
        const schema = opencodeHookResultTool.getInputSchema();
        expect(schema.type).toBe('object');
        expect(schema.properties).toBeDefined();
    });
});

describe('opencode_hook_wake', () => {
    beforeEach(async () => {
        testDir = join(tmpdir(), `opencode-hook-test-wake-${Date.now()}`);
        await mkdir(testDir, { recursive: true });
    });

    afterEach(async () => {
        await rm(testDir, { recursive: true, force: true });
    });

    it('应有正确的工具名称', () => {
        expect(opencodeHookWakeTool.name).toBe('opencode_hook_wake');
        expect(opencodeHookWakeTool.description).toContain('OpenCode');
        expect(opencodeHookWakeTool.description).toContain('Cross-platform');
    });

    it('应读取 pending-wake.json', async () => {
        const mockWake = {
            task_name: 'wake-test',
            group: '-5555',
            timestamp: '2026-03-04T14:00:00+08:00',
            summary: 'Task completed successfully',
            processed: false,
        };
        await writeFile(join(testDir, 'pending-wake.json'), JSON.stringify(mockWake), 'utf-8');

        const executor = createMockExecutor();
        const result = await opencodeHookWakeTool.execute(executor, {
            result_dir: testDir,
        });

        const data = JSON.parse(result.content[0].text);
        expect(data.task_name).toBe('wake-test');
        expect(data.processed).toBe(false);
    });

    it('文件不存在时应返回 no_pending_wake', async () => {
        const executor = createMockExecutor();
        const result = await opencodeHookWakeTool.execute(executor, {
            result_dir: testDir,
        });

        const data = JSON.parse(result.content[0].text);
        expect(data.status).toBe('no_pending_wake');
        expect(data.hint).toContain('OpenCode');
    });

    it('应标记 already_processed', async () => {
        const mockWake = { task_name: 'old-task', processed: true };
        await writeFile(join(testDir, 'pending-wake.json'), JSON.stringify(mockWake), 'utf-8');

        const executor = createMockExecutor();
        const result = await opencodeHookWakeTool.execute(executor, {
            result_dir: testDir,
        });

        const data = JSON.parse(result.content[0].text);
        expect(data.status).toBe('already_processed');
    });

    it('mark_processed=true 应更新文件（跨平台验证）', async () => {
        const mockWake = { task_name: 'process-me', processed: false };
        await writeFile(join(testDir, 'pending-wake.json'), JSON.stringify(mockWake), 'utf-8');

        const executor = createMockExecutor();
        await opencodeHookWakeTool.execute(executor, {
            result_dir: testDir,
            mark_processed: true,
        });

        // 直接读取文件验证（跨平台 Node.js fs）
        const raw = await readFile(join(testDir, 'pending-wake.json'), 'utf-8');
        const onDisk = JSON.parse(raw);
        expect(onDisk.processed).toBe(true);
        expect(onDisk.processed_at).toBeDefined();

        // 再次通过工具读取验证
        const result2 = await opencodeHookWakeTool.execute(executor, {
            result_dir: testDir,
        });
        const data2 = JSON.parse(result2.content[0].text);
        expect(data2.status).toBe('already_processed');
    });

    it('inputSchema 应为合法格式', () => {
        const schema = opencodeHookWakeTool.getInputSchema();
        expect(schema.type).toBe('object');
        expect(schema.properties).toBeDefined();
    });
});
