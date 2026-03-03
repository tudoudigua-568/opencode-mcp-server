/**
 * OpenCode MCP Server - superpower skill 技能系统工具
 * 管理和使用 OpenCode 的 superpower 技能
 *
 * Skills 是知识集合或特定任务的操作规程（SOP），
 * 代理可按需访问这些技能来增强其能力。
 *
 * @author shichao.han
 * @version 1.1.0
 * @date 2026/02/13 13:43
 */

import { z } from 'zod';
import { type ToolDefinition, type ToolResult } from '../tool-definition.js';
import { type CommandExecutor } from '../executor.js';

/* ============================================================
 * opencode_skill_list — 列出可用技能
 * ============================================================ */

export const opencodeSkillListTool: ToolDefinition = {
    name: 'opencode_skill_list',
    description:
        'List all available superpower skills in OpenCode. ' +
        'Skills are knowledge sets or SOPs that agents can access on demand (e.g., playwright, git-master).',

    getInputSchema() {
        return { type: 'object', properties: {}, required: [] };
    },

    async execute(executor: CommandExecutor): Promise<ToolResult> {
        // 通过 opencode run 使用 find_skills 工具来列出可用技能
        const result = await executor.execute([
            'run',
            '"List all available skills using find_skills tool and output their names and descriptions"',
            '-q',
        ]);

        if (result.success) {
            return { content: [{ type: 'text', text: result.stdout || '(No skills found)' }] };
        }
        return {
            content: [{ type: 'text', text: `Failed to list skills (exit code: ${result.exitCode})\n${result.stderr}\n${result.stdout}` }],
            isError: true,
        };
    },
};

/* ============================================================
 * opencode_skill_use — 激活并使用技能
 * ============================================================ */

const skillUseSchema = z.object({
    skill: z.string().min(1).describe('Skill name to activate (e.g., "playwright", "git-master")'),
    prompt: z.string().min(1).describe('Task prompt to execute with the skill context'),
    workspace: z.string().optional().describe('Working directory path'),
    model: z.string().optional().describe('LLM model to use'),
});

export const opencodeSkillUseTool: ToolDefinition = {
    name: 'opencode_skill_use',
    description:
        'Activate and use a superpower skill for a specific task. ' +
        'The skill provides specialized knowledge context to the agent (e.g., playwright for browser automation, git-master for atomic commits).',

    getInputSchema() {
        return {
            type: 'object',
            properties: {
                skill: { type: 'string', description: 'Skill name to activate', minLength: 1 },
                prompt: { type: 'string', description: 'Task prompt to execute with the skill context', minLength: 1 },
                workspace: { type: 'string', description: 'Working directory path' },
                model: { type: 'string', description: 'LLM model to use' },
            },
            required: ['skill', 'prompt'],
        };
    },

    async execute(executor: CommandExecutor, args: Record<string, unknown>): Promise<ToolResult> {
        const parsed = skillUseSchema.parse(args);

        // 通过 opencode run 触发 use_skill 并结合 prompt
        const combinedPrompt = `Use skill "${parsed.skill}". ${parsed.prompt}`;
        const cmdArgs: string[] = ['run', `"${combinedPrompt}"`, '-q'];

        if (parsed.model) {
            cmdArgs.push('--model', parsed.model);
        }

        const result = await executor.execute(cmdArgs, parsed.workspace);
        if (result.success) {
            return { content: [{ type: 'text', text: result.stdout || `(Skill "${parsed.skill}" completed with no output)` }] };
        }
        return {
            content: [{ type: 'text', text: `Skill "${parsed.skill}" failed (exit code: ${result.exitCode})\n${result.stderr}\n${result.stdout}` }],
            isError: true,
        };
    },
};
