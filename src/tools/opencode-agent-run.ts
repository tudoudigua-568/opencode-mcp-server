/**
 * OpenCode MCP Server - opencode_agent_run 工具
 * 使用指定代理执行 AI 编码任务
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
    agent: z.string().min(1).describe('Agent name to use (e.g., "build", "plan", or a custom agent name)'),
    prompt: z.string().min(1).describe('The coding prompt/instruction to send'),
    workspace: z.string().optional().describe('Working directory path'),
    model: z.string().optional().describe('Override the agent default model'),
});

/**
 * opencode_agent_run 工具实现
 * 使用 @agent 语法在 prompt 中指定代理
 */
export const opencodeAgentRunTool: ToolDefinition = {
    name: 'opencode_agent_run',
    description:
        'Execute a prompt using a specific OpenCode agent (e.g., "build", "plan", or custom agents). ' +
        'Each agent has its own system prompt, model, and tool permissions.',

    getInputSchema() {
        return {
            type: 'object',
            properties: {
                agent: { type: 'string', description: 'Agent name to use', minLength: 1 },
                prompt: { type: 'string', description: 'The coding prompt/instruction to send', minLength: 1 },
                workspace: { type: 'string', description: 'Working directory path' },
                model: { type: 'string', description: 'Override the agent default model' },
            },
            required: ['agent', 'prompt'],
        };
    },

    async execute(executor: CommandExecutor, args: Record<string, unknown>): Promise<ToolResult> {
        const parsed = inputSchema.parse(args);

        // 使用 @agent 前缀在 prompt 中指定代理
        const agentPrompt = `@${parsed.agent} ${parsed.prompt}`;
        const cmdArgs: string[] = ['run', `"${agentPrompt}"`, '-q'];

        if (parsed.model) {
            cmdArgs.push('--model', parsed.model);
        }

        const result = await executor.execute(cmdArgs, parsed.workspace);
        if (result.success) {
            return { content: [{ type: 'text', text: result.stdout || `(Agent "${parsed.agent}" completed with no output)` }] };
        }
        return {
            content: [{ type: 'text', text: `Agent "${parsed.agent}" failed (exit code: ${result.exitCode})\n${result.stderr}\n${result.stdout}` }],
            isError: true,
        };
    },
};
