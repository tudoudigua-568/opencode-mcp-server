/**
 * OpenCode MCP Server - opencode_session_fork 工具
 * 从已有会话分叉创建新会话并执行新 prompt
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
    sessionId: z.string().min(1).describe('Session ID to fork from'),
    prompt: z.string().min(1).describe('New prompt to execute in the forked session'),
    workspace: z.string().optional().describe('Working directory path'),
    model: z.string().optional().describe('LLM model to use in the forked session'),
});

/**
 * opencode_session_fork 工具实现
 */
export const opencodeSessionForkTool: ToolDefinition = {
    name: 'opencode_session_fork',
    description: 'Fork an existing OpenCode session and execute a new prompt in the forked copy.',

    getInputSchema() {
        return {
            type: 'object',
            properties: {
                sessionId: { type: 'string', description: 'Session ID to fork from', minLength: 1 },
                prompt: { type: 'string', description: 'New prompt to execute in the forked session', minLength: 1 },
                workspace: { type: 'string', description: 'Working directory path' },
                model: { type: 'string', description: 'LLM model to use in the forked session' },
            },
            required: ['sessionId', 'prompt'],
        };
    },

    async execute(executor: CommandExecutor, args: Record<string, unknown>): Promise<ToolResult> {
        const parsed = inputSchema.parse(args);
        const cmdArgs: string[] = [
            'run', `"${parsed.prompt}"`,
            '--session', parsed.sessionId,
            '--fork',
            '-q',
        ];

        if (parsed.model) {
            cmdArgs.push('--model', parsed.model);
        }

        const result = await executor.execute(cmdArgs, parsed.workspace);
        if (result.success) {
            return { content: [{ type: 'text', text: result.stdout || '(Forked session completed with no output)' }] };
        }
        return {
            content: [{ type: 'text', text: `Failed to fork session (exit code: ${result.exitCode})\n${result.stderr}\n${result.stdout}` }],
            isError: true,
        };
    },
};
