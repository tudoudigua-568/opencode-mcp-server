/**
 * OpenCode MCP Server - opencode_command_run 工具
 * 执行 OpenCode 自定义命令（slash commands）
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
    command: z.string().min(1).describe('Custom command name (without leading /)'),
    args: z.record(z.string()).optional().describe('Named arguments for the command (key-value pairs)'),
    workspace: z.string().optional().describe('Working directory path'),
});

/**
 * opencode_command_run 工具实现
 * 
 * OpenCode 自定义命令是 Markdown 文件中定义的预设 prompt 模板，
 * 通过 /command-name 触发。此工具通过 opencode run 模拟触发。
 */
export const opencodeCommandRunTool: ToolDefinition = {
    name: 'opencode_command_run',
    description:
        'Execute an OpenCode custom slash command by name. ' +
        'Custom commands are predefined prompt templates.',

    getInputSchema() {
        return {
            type: 'object',
            properties: {
                command: { type: 'string', description: 'Custom command name (without leading /)', minLength: 1 },
                args: {
                    type: 'object',
                    additionalProperties: { type: 'string' },
                    description: 'Named arguments for the command (key-value pairs)',
                },
                workspace: { type: 'string', description: 'Working directory path' },
            },
            required: ['command'],
        };
    },

    async execute(executor: CommandExecutor, args: Record<string, unknown>): Promise<ToolResult> {
        const parsed = inputSchema.parse(args);

        // 构建命令字符串：/command arg1:val1 arg2:val2
        let cmdStr = `/${parsed.command}`;
        if (parsed.args) {
            for (const [key, value] of Object.entries(parsed.args)) {
                cmdStr += ` ${key}:${value}`;
            }
        }

        const result = await executor.execute(
            ['run', `"${cmdStr}"`, '-q'],
            parsed.workspace,
        );

        if (result.success) {
            return { content: [{ type: 'text', text: result.stdout || `(Command "/${parsed.command}" completed)` }] };
        }
        return {
            content: [{ type: 'text', text: `Command "/${parsed.command}" failed (exit code: ${result.exitCode})\n${result.stderr}\n${result.stdout}` }],
            isError: true,
        };
    },
};
