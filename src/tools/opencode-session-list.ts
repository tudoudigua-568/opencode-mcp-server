/**
 * OpenCode MCP Server - opencode_session_list 工具
 * 列出所有 OpenCode 会话记录
 *
 * @author shichao.han
 * @version 1.1.0
 * @date 2026/02/13 13:43
 */

import { type ToolDefinition, type ToolResult } from '../tool-definition.js';
import { type CommandExecutor } from '../executor.js';

/**
 * opencode_session_list 工具实现
 */
export const opencodeSessionListTool: ToolDefinition = {
    name: 'opencode_session_list',
    description: 'List all available OpenCode sessions with their IDs and metadata.',

    getInputSchema() {
        return { type: 'object', properties: {}, required: [] };
    },

    async execute(executor: CommandExecutor): Promise<ToolResult> {
        const result = await executor.execute(['session', 'list']);
        if (result.success) {
            return { content: [{ type: 'text', text: result.stdout || '(No sessions found)' }] };
        }
        return {
            content: [{ type: 'text', text: `Failed to list sessions (exit code: ${result.exitCode})\n${result.stderr}` }],
            isError: true,
        };
    },
};
