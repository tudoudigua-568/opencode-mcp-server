/**
 * OpenCode MCP Server - Superpowers Brainstorm + Ralph Loop
 * 结合 superpower 的 brainstorm 技能和 oh-my-opencode 的 ralph 代理
 * 
 * 首先使用 brainstorm 写出 plan，然后交给 ralph 去执行。
 *
 * @author shichao.han
 * @version 1.1.0
 * @date 2026/03/09 17:21
 */

import { z } from 'zod';
import { type ToolDefinition, type ToolResult } from '../tool-definition.js';
import { type CommandExecutor } from '../executor.js';

const brainstormRalphSchema = z.object({
    goal: z.string().min(1).describe('The goal/task to brainstorm and execute'),
    workspace: z.string().optional().describe('Working directory path'),
    model: z.string().optional().describe('LLM model to use'),
});

export const opencodeBrainstormRalphTool: ToolDefinition = {
    name: 'opencode_brainstorm_ralph',
    description:
        'Use the "brainstorm" skill from superpowers to create a detailed plan, ' +
        'and then delegate the execution to the "ralph" agent (oh-my-opencode) to implement it step by step.',

    getInputSchema() {
        return {
            type: 'object',
            properties: {
                goal: { type: 'string', description: 'The goal/task to brainstorm and execute', minLength: 1 },
                workspace: { type: 'string', description: 'Working directory path' },
                model: { type: 'string', description: 'LLM model to use' },
            },
            required: ['goal'],
        };
    },

    async execute(executor: CommandExecutor, args: Record<string, unknown>): Promise<ToolResult> {
        const parsed = brainstormRalphSchema.parse(args);

        // 核心组合 prompt：调用 brainstorm 技能写 plan，然后用 @ralph 执行
        const combinedPrompt = `Use skill "brainstorm" to brainstorm and write a plan for: ${parsed.goal}. Once the plan is ready, hand it over to @ralph to execute the plan step by step.`;
        const cmdArgs: string[] = ['run', `"${combinedPrompt}"`, '-q'];

        if (parsed.model) {
            cmdArgs.push('--model', parsed.model);
        }

        const result = await executor.execute(cmdArgs, parsed.workspace);
        if (result.success) {
            return { content: [{ type: 'text', text: result.stdout || '(Brainstorm+Ralph completed with no output)' }] };
        }
        return {
            content: [{ type: 'text', text: `Brainstorm+Ralph failed (exit code: ${result.exitCode})\n${result.stderr}\n${result.stdout}` }],
            isError: true,
        };
    },
};
