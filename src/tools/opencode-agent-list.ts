/**
 * OpenCode MCP Server - opencode_agent_list 工具
 * 列出所有可用的 OpenCode 代理（内置 + 自定义）
 *
 * @author shichao.han
 * @version 1.1.0
 * @date 2026/02/13 13:43
 */

import { type ToolDefinition, type ToolResult } from '../tool-definition.js';
import { type CommandExecutor } from '../executor.js';

/**
 * opencode_agent_list 工具实现
 */
export const opencodeAgentListTool: ToolDefinition = {
    name: 'opencode_agent_list',
    description: 'List all available OpenCode agents (built-in and custom), showing their names and configurations.',

    getInputSchema() {
        return { type: 'object', properties: {}, required: [] };
    },

    async execute(executor: CommandExecutor): Promise<ToolResult> {
        const result = await executor.execute(['agent', 'list']);
        if (result.success) {
            return { content: [{ type: 'text', text: result.stdout || '(No agents found)' }] };
        }
        return {
            content: [{ type: 'text', text: `Failed to list agents (exit code: ${result.exitCode})\n${result.stderr}` }],
            isError: true,
        };
    },
};
