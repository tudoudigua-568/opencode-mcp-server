/**
 * OpenCode MCP Server - opencode_models 工具
 * 查询 OpenCode 中已配置的可用 LLM 模型列表
 *
 * @author shichao.han
 * @version 1.1.0
 * @date 2026/02/13 13:43
 */

import { type ToolDefinition, type ToolResult } from '../tool-definition.js';
import { type CommandExecutor } from '../executor.js';

/**
 * opencode_models 工具实现
 */
export const opencodeModelsTool: ToolDefinition = {
    name: 'opencode_models',
    description: 'List all available LLM models configured in OpenCode (provider/model format).',

    getInputSchema() {
        return { type: 'object', properties: {}, required: [] };
    },

    async execute(executor: CommandExecutor): Promise<ToolResult> {
        const result = await executor.listModels();
        if (result.success) {
            return { content: [{ type: 'text', text: result.stdout || '(No models found)' }] };
        }
        return {
            content: [{ type: 'text', text: `Failed to list models (exit code: ${result.exitCode})\n${result.stderr}` }],
            isError: true,
        };
    },
};
