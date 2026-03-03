/**
 * OpenCode MCP Server - opencode_run 工具
 * 核心功能：通过 MCP 协议暴露 OpenCode 的非交互式 AI 编码能力
 *
 * @author shichao.han
 * @version 1.1.0
 * @date 2026/02/13 13:43
 */

import { z } from 'zod';
import { type ToolDefinition, type ToolResult } from '../tool-definition.js';
import { type CommandExecutor } from '../executor.js';

/** 输入参数 Schema */
const inputSchema = z.object({
    prompt: z.string().min(1).describe('The coding prompt/instruction to send to OpenCode AI'),
    workspace: z.string().optional().describe('Working directory path (default: current directory)'),
    model: z.string().optional().describe('LLM model identifier (e.g., "anthropic/claude-sonnet-4-20250514")'),
    quiet: z.boolean().optional().default(true).describe('Suppress spinner animation (default: true)'),
});

/**
 * opencode_run 工具实现
 */
export const opencodeRunTool: ToolDefinition = {
    name: 'opencode_run',
    description:
        'Execute an AI coding prompt via OpenCode CLI in non-interactive mode. ' +
        'Suitable for code generation, debugging, refactoring, and code explanation tasks.',

    getInputSchema() {
        return {
            type: 'object',
            properties: {
                prompt: { type: 'string', description: 'The coding prompt/instruction to send to OpenCode AI', minLength: 1 },
                workspace: { type: 'string', description: 'Working directory path (default: current directory)' },
                model: { type: 'string', description: 'LLM model identifier (e.g., "anthropic/claude-sonnet-4-20250514")' },
                quiet: { type: 'boolean', description: 'Suppress spinner animation (default: true)', default: true },
            },
            required: ['prompt'],
        };
    },

    async execute(executor: CommandExecutor, args: Record<string, unknown>): Promise<ToolResult> {
        const parsed = inputSchema.parse(args);
        const result = await executor.runPrompt(parsed.prompt, {
            workspace: parsed.workspace,
            model: parsed.model,
            quiet: parsed.quiet,
        });

        if (result.success) {
            return {
                content: [{ type: 'text', text: result.stdout || '(OpenCode completed with no output)' }],
            };
        }

        const errorMsg = [
            `OpenCode execution failed (exit code: ${result.exitCode})`,
            result.stderr ? `\nSTDERR:\n${result.stderr}` : '',
            result.stdout ? `\nSTDOUT:\n${result.stdout}` : '',
        ].join('');

        return { content: [{ type: 'text', text: errorMsg }], isError: true };
    },
};
