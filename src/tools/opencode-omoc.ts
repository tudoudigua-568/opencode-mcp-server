/**
 * OpenCode MCP Server - oh-my-opencode 多代理编排工具
 * Sisyphus（目标驱动编排）、Prometheus（交互式咨询）、Subagent（异步子代理）
 *
 * oh-my-opencode 将单个 AI 编码代理转化为协作团队，
 * 通过多模型工作流和并行执行大幅提升 AI 编码效率。
 *
 * @author shichao.han
 * @version 1.1.0
 * @date 2026/02/13 13:43
 */

import { z } from 'zod';
import { type ToolDefinition, type ToolResult } from '../tool-definition.js';
import { type CommandExecutor } from '../executor.js';

/* ============================================================
 * opencode_sisyphus — Sisyphus 编排模式
 * 规划 → 探索 → 委派 → 执行 → 验证
 * ============================================================ */

const sisyphusSchema = z.object({
    goal: z.string().min(1).describe('The complex goal/task for Sisyphus to plan and execute'),
    workspace: z.string().optional().describe('Working directory path'),
    model: z.string().optional().describe('Override orchestrator model'),
});

export const opencodeSisyphusTool: ToolDefinition = {
    name: 'opencode_sisyphus',
    description:
        'Execute a complex task using oh-my-opencode Sisyphus orchestration mode. ' +
        'Sisyphus plans, delegates to parallel agents (explore + librarian), and executes until the task is fully verified. ' +
        'Best for complex multi-step development tasks.',

    getInputSchema() {
        return {
            type: 'object',
            properties: {
                goal: { type: 'string', description: 'The complex goal/task for Sisyphus to plan and execute', minLength: 1 },
                workspace: { type: 'string', description: 'Working directory path' },
                model: { type: 'string', description: 'Override orchestrator model' },
            },
            required: ['goal'],
        };
    },

    async execute(executor: CommandExecutor, args: Record<string, unknown>): Promise<ToolResult> {
        const parsed = sisyphusSchema.parse(args);

        // Sisyphus 通过 oh-my-opencode 的 /sisyphus 命令触发
        const prompt = `/sisyphus ${parsed.goal}`;
        const cmdArgs: string[] = ['run', `"${prompt}"`, '-q'];

        if (parsed.model) {
            cmdArgs.push('--model', parsed.model);
        }

        const result = await executor.execute(cmdArgs, parsed.workspace);
        if (result.success) {
            return { content: [{ type: 'text', text: result.stdout || '(Sisyphus completed with no output)' }] };
        }
        return {
            content: [{ type: 'text', text: `Sisyphus execution failed (exit code: ${result.exitCode})\n${result.stderr}\n${result.stdout}` }],
            isError: true,
        };
    },
};

/* ============================================================
 * opencode_prometheus — Prometheus 咨询模式
 * 交互式分析、提问和规划
 * ============================================================ */

const prometheusSchema = z.object({
    query: z.string().min(1).describe('The question or topic for Prometheus to analyze and plan'),
    workspace: z.string().optional().describe('Working directory path'),
    model: z.string().optional().describe('Override consultant model'),
});

export const opencodePrometheusTool: ToolDefinition = {
    name: 'opencode_prometheus',
    description:
        'Use oh-my-opencode Prometheus consulting mode for interactive analysis and planning. ' +
        'Prometheus asks clarifying questions, analyzes the codebase, and generates detailed work plans.',

    getInputSchema() {
        return {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'The question or topic for Prometheus to analyze', minLength: 1 },
                workspace: { type: 'string', description: 'Working directory path' },
                model: { type: 'string', description: 'Override consultant model' },
            },
            required: ['query'],
        };
    },

    async execute(executor: CommandExecutor, args: Record<string, unknown>): Promise<ToolResult> {
        const parsed = prometheusSchema.parse(args);

        const prompt = `/prometheus ${parsed.query}`;
        const cmdArgs: string[] = ['run', `"${prompt}"`, '-q'];

        if (parsed.model) {
            cmdArgs.push('--model', parsed.model);
        }

        const result = await executor.execute(cmdArgs, parsed.workspace);
        if (result.success) {
            return { content: [{ type: 'text', text: result.stdout || '(Prometheus completed with no output)' }] };
        }
        return {
            content: [{ type: 'text', text: `Prometheus failed (exit code: ${result.exitCode})\n${result.stderr}\n${result.stdout}` }],
            isError: true,
        };
    },
};

/* ============================================================
 * opencode_subagent — 异步子代理调用
 * 分派任务到专门的后台代理并行执行
 * ============================================================ */

const subagentSchema = z.object({
    task: z.string().min(1).describe('Task description for the subagent'),
    agent: z.string().optional().describe('Specific agent to use (default: general subagent)'),
    model: z.string().optional().describe('LLM model for the subagent'),
    workspace: z.string().optional().describe('Working directory path'),
});

export const opencodeSubagentTool: ToolDefinition = {
    name: 'opencode_subagent',
    description:
        'Dispatch a task to an oh-my-opencode asynchronous subagent for parallel execution. ' +
        'Subagents handle smaller, targeted chunks of work independently.',

    getInputSchema() {
        return {
            type: 'object',
            properties: {
                task: { type: 'string', description: 'Task description for the subagent', minLength: 1 },
                agent: { type: 'string', description: 'Specific agent to use (default: general subagent)' },
                model: { type: 'string', description: 'LLM model for the subagent' },
                workspace: { type: 'string', description: 'Working directory path' },
            },
            required: ['task'],
        };
    },

    async execute(executor: CommandExecutor, args: Record<string, unknown>): Promise<ToolResult> {
        const parsed = subagentSchema.parse(args);

        // 子代理通过 @subagent 语法或特定代理名指定
        let prompt: string;
        if (parsed.agent) {
            prompt = `@${parsed.agent} ${parsed.task}`;
        } else {
            prompt = parsed.task;
        }

        const cmdArgs: string[] = ['run', `"${prompt}"`, '-q'];

        if (parsed.model) {
            cmdArgs.push('--model', parsed.model);
        }

        const result = await executor.execute(cmdArgs, parsed.workspace);
        if (result.success) {
            return { content: [{ type: 'text', text: result.stdout || '(Subagent completed with no output)' }] };
        }
        return {
            content: [{ type: 'text', text: `Subagent failed (exit code: ${result.exitCode})\n${result.stderr}\n${result.stdout}` }],
            isError: true,
        };
    },
};
