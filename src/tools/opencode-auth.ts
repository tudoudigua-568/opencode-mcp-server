/**
 * OpenCode MCP Server - opencode_auth 工具
 * 查看 OpenCode 的认证状态和已配置的 LLM 提供商凭据
 *
 * @author shichao.han
 * @version 1.1.0
 * @date 2026/02/13 13:43
 */

import { type ToolDefinition, type ToolResult } from '../tool-definition.js';
import { type CommandExecutor } from '../executor.js';

/**
 * opencode_auth 工具实现
 */
export const opencodeAuthTool: ToolDefinition = {
    name: 'opencode_auth',
    description: 'View authentication status and configured LLM provider credentials in OpenCode.',

    getInputSchema() {
        return { type: 'object', properties: {}, required: [] };
    },

    async execute(executor: CommandExecutor): Promise<ToolResult> {
        const result = await executor.listAuth();
        if (result.success) {
            return { content: [{ type: 'text', text: result.stdout || '(No credentials configured)' }] };
        }
        return {
            content: [{ type: 'text', text: `Failed to list auth info (exit code: ${result.exitCode})\n${result.stderr}` }],
            isError: true,
        };
    },
};
