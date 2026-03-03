/**
 * OpenCode MCP Server - opencode_session_continue 工具
 * 继续一个已有的 OpenCode 会话，可选发送新 prompt
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
    sessionId: z.string().min(1).describe('Session ID to continue'),
    prompt: z.string().optional().describe('Optional new prompt to send in the continued session'),
    workspace: z.string().optional().describe('Working directory path'),
});

/**
 * opencode_session_continue 工具实现
 */
export const opencodeSessionContinueTool: ToolDefinition = {
    name: 'opencode_session_continue',
    description: 'Continue an existing OpenCode session with an optional new prompt.',

    getInputSchema() {
        return {
            type: 'object',
            properties: {
                sessionId: { type: 'string', description: 'Session ID to continue', minLength: 1 },
                prompt: { type: 'string', description: 'Optional new prompt to send in the continued session' },
                workspace: { type: 'string', description: 'Working directory path' },
            },
            required: ['sessionId'],
        };
    },

    async execute(executor: CommandExecutor, args: Record<string, unknown>): Promise<ToolResult> {
        const parsed = inputSchema.parse(args);
        const cmdArgs: string[] = [];

        if (parsed.prompt) {
            cmdArgs.push('run', `"${parsed.prompt}"`, '--session', parsed.sessionId, '-q');
        } else {
            cmdArgs.push('run', '"Continue the previous task"', '--session', parsed.sessionId, '-q');
        }

        const result = await executor.execute(cmdArgs, parsed.workspace);
        if (result.success) {
            return { content: [{ type: 'text', text: result.stdout || '(Session continued with no output)' }] };
        }
        return {
            content: [{ type: 'text', text: `Failed to continue session (exit code: ${result.exitCode})\n${result.stderr}\n${result.stdout}` }],
            isError: true,
        };
    },
};
