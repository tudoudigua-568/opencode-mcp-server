/**
 * OpenCode MCP Server - opencode_session_export 工具
 * 导出指定会话的完整对话记录
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
    sessionId: z.string().min(1).describe('Session ID to export'),
});

/**
 * opencode_session_export 工具实现
 */
export const opencodeSessionExportTool: ToolDefinition = {
    name: 'opencode_session_export',
    description: 'Export an OpenCode session transcript as text/markdown.',

    getInputSchema() {
        return {
            type: 'object',
            properties: {
                sessionId: { type: 'string', description: 'Session ID to export', minLength: 1 },
            },
            required: ['sessionId'],
        };
    },

    async execute(executor: CommandExecutor, args: Record<string, unknown>): Promise<ToolResult> {
        const parsed = inputSchema.parse(args);
        const result = await executor.execute(['session', 'export', parsed.sessionId]);
        if (result.success) {
            return { content: [{ type: 'text', text: result.stdout || '(Empty session export)' }] };
        }
        return {
            content: [{ type: 'text', text: `Failed to export session (exit code: ${result.exitCode})\n${result.stderr}` }],
            isError: true,
        };
    },
};
