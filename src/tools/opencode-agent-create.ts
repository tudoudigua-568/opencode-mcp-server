/**
 * OpenCode MCP Server - opencode_agent_create 工具
 * 创建自定义 OpenCode 代理（通过配置文件方式）
 *
 * @author shichao.han
 * @version 1.1.0
 * @date 2026/02/13 13:43
 */

import { z } from 'zod';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { type ToolDefinition, type ToolResult } from '../tool-definition.js';
import { type CommandExecutor } from '../executor.js';

/** 输入参数 Schema */
const inputSchema = z.object({
    name: z.string().min(1).describe('Agent name (used as identifier)'),
    model: z.string().optional().describe('LLM model for this agent'),
    systemPrompt: z.string().min(1).describe('System prompt defining the agent behavior'),
    tools: z.array(z.string()).optional().describe('List of tool names this agent can access'),
});

/**
 * opencode_agent_create 工具实现
 * 
 * 设计决策：由于 `opencode agent create` 是交互式的，
 * 我们通过写入配置文件的方式来实现非交互式创建。
 * 自定义代理可放在 ~/.config/opencode/agents/ 或项目的 .opencode/agents/ 目录。
 */
export const opencodeAgentCreateTool: ToolDefinition = {
    name: 'opencode_agent_create',
    description:
        'Create a custom OpenCode agent by writing its configuration file. ' +
        'Agents are specialized AI assistants with custom system prompts, model assignments, and tool access.',

    getInputSchema() {
        return {
            type: 'object',
            properties: {
                name: { type: 'string', description: 'Agent name (used as identifier)', minLength: 1 },
                model: { type: 'string', description: 'LLM model for this agent' },
                systemPrompt: { type: 'string', description: 'System prompt defining the agent behavior', minLength: 1 },
                tools: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of tool names this agent can access',
                },
            },
            required: ['name', 'systemPrompt'],
        };
    },

    async execute(_executor: CommandExecutor, args: Record<string, unknown>): Promise<ToolResult> {
        const parsed = inputSchema.parse(args);

        // 构建代理配置 Markdown 文件
        const lines: string[] = [
            '---',
            `name: ${parsed.name}`,
        ];

        if (parsed.model) {
            lines.push(`model: ${parsed.model}`);
        }

        if (parsed.tools && parsed.tools.length > 0) {
            lines.push('tools:');
            for (const tool of parsed.tools) {
                lines.push(`  - ${tool}`);
            }
        }

        lines.push('---', '', parsed.systemPrompt);

        // 写入 ~/.config/opencode/agents/<name>.md
        const agentsDir = join(homedir(), '.config', 'opencode', 'agents');
        const filePath = join(agentsDir, `${parsed.name}.md`);

        try {
            await mkdir(agentsDir, { recursive: true });
            await writeFile(filePath, lines.join('\n'), 'utf-8');

            return {
                content: [{
                    type: 'text',
                    text: `Agent "${parsed.name}" created successfully at:\n${filePath}\n\nConfiguration:\n${lines.join('\n')}`,
                }],
            };
        } catch (error) {
            return {
                content: [{
                    type: 'text',
                    text: `Failed to create agent: ${error instanceof Error ? error.message : String(error)}`,
                }],
                isError: true,
            };
        }
    },
};
