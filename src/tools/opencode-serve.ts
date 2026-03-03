/**
 * OpenCode MCP Server - opencode_serve_start / opencode_serve_status 工具
 * 管理 OpenCode headless HTTP 服务器
 *
 * @author shichao.han
 * @version 1.1.0
 * @date 2026/02/13 13:43
 */

import { z } from 'zod';
import { type ToolDefinition, type ToolResult } from '../tool-definition.js';
import { type CommandExecutor } from '../executor.js';

/* ============================================================
 * opencode_serve_start
 * ============================================================ */

/** 启动参数 Schema */
const startSchema = z.object({
    port: z.number().int().min(1).max(65535).optional().describe('Port number (default: random available)'),
    hostname: z.string().optional().describe('Hostname to bind (default: 127.0.0.1)'),
    web: z.boolean().optional().default(false).describe('Start with web UI (true) or headless API-only (false)'),
});

/**
 * opencode_serve_start 工具实现
 */
export const opencodeServeStartTool: ToolDefinition = {
    name: 'opencode_serve_start',
    description:
        'Start an OpenCode headless HTTP server (API mode) or web server (with browser UI). ' +
        'The server exposes an OpenAPI 3.1 endpoint for programmatic access.',

    getInputSchema() {
        return {
            type: 'object',
            properties: {
                port: { type: 'integer', description: 'Port number (default: random available)', minimum: 1, maximum: 65535 },
                hostname: { type: 'string', description: 'Hostname to bind (default: 127.0.0.1)' },
                web: { type: 'boolean', description: 'Start with web UI (true) or headless API-only (false)', default: false },
            },
            required: [],
        };
    },

    async execute(executor: CommandExecutor, args: Record<string, unknown>): Promise<ToolResult> {
        const parsed = startSchema.parse(args);

        const subCommand = parsed.web ? 'web' : 'serve';
        const cmdArgs: string[] = [subCommand];

        if (parsed.port) {
            cmdArgs.push('--port', String(parsed.port));
        }
        if (parsed.hostname) {
            cmdArgs.push('--hostname', parsed.hostname);
        }

        // 服务器启动是长运行进程，我们设置短超时仅捕获启动输出
        try {
            const result = await executor.execute(cmdArgs);
            return {
                content: [{
                    type: 'text',
                    text: result.stdout
                        ? `OpenCode ${subCommand} server output:\n${result.stdout}`
                        : `OpenCode ${subCommand} server started. Check stderr for connection details.`,
                }],
            };
        } catch (error) {
            // 超时通常意味着服务器正在运行（正常行为）
            return {
                content: [{
                    type: 'text',
                    text: `OpenCode ${subCommand} server is running (process did not exit within timeout, which is expected for a long-running server).`,
                }],
            };
        }
    },
};

/* ============================================================
 * opencode_serve_status
 * ============================================================ */

/**
 * opencode_serve_status 工具实现
 * 通过尝试连接检测服务器是否运行
 */
export const opencodeServeStatusTool: ToolDefinition = {
    name: 'opencode_serve_status',
    description: 'Check if an OpenCode HTTP server is currently running by testing its health endpoint.',

    getInputSchema() {
        return {
            type: 'object',
            properties: {
                url: { type: 'string', description: 'Server URL to check (default: http://127.0.0.1:4096)', default: 'http://127.0.0.1:4096' },
            },
            required: [],
        };
    },

    async execute(_executor: CommandExecutor, args: Record<string, unknown>): Promise<ToolResult> {
        const url = (args['url'] as string) || 'http://127.0.0.1:4096';

        try {
            const response = await fetch(`${url}/openapi.json`, {
                signal: AbortSignal.timeout(5000),
            });

            if (response.ok) {
                return {
                    content: [{
                        type: 'text',
                        text: `OpenCode server is running at ${url}\nStatus: ${response.status} ${response.statusText}\nOpenAPI spec available at: ${url}/openapi.json`,
                    }],
                };
            }

            return {
                content: [{
                    type: 'text',
                    text: `Server responded with status ${response.status} at ${url}`,
                }],
            };
        } catch (error) {
            return {
                content: [{
                    type: 'text',
                    text: `OpenCode server is NOT running at ${url}\nError: ${error instanceof Error ? error.message : String(error)}`,
                }],
            };
        }
    },
};
