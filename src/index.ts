#!/usr/bin/env node
/**
 * OpenCode MCP Server - 主入口文件
 * 通过 MCP 协议将 OpenCode CLI 的全部 AI 编码能力暴露为标准化工具服务
 * 
 * 架构：适配器层，桥接 MCP 客户端（如 OpenClaw）与 OpenCode CLI
 * 传输：stdio（标准输入/输出）
 * 
 * 支持功能：
 * - 核心：AI 编码、模型管理、认证
 * - Session：会话列表、继续、导出、分叉
 * - Agent：代理列表、创建、指定代理执行
 * - 命令：自定义 slash 命令执行
 * - 服务：headless HTTP / Web UI 服务器
 * - oh-my-opencode：Sisyphus 编排、Prometheus 咨询、异步子代理
 * - superpower：技能列表、技能激活使用
 *
 * @author shichao.han
 * @version 1.1.0
 * @date 2026/02/13 13:43
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { loadConfig } from './config.js';
import { CommandExecutor, ExecutionTimeoutError } from './executor.js';
import { ToolRegistry } from './tool-registry.js';
import { ALL_TOOLS } from './tools/index.js';

/**
 * 创建并启动 MCP Server
 * 
 * 职责：
 * 1. 加载配置
 * 2. 初始化命令执行器（适配器核心）
 * 3. 注册所有工具到 ToolRegistry
 * 4. 绑定 MCP 请求处理器
 * 5. 建立 stdio 传输连接
 */
async function main(): Promise<void> {
    // 1. 加载配置
    const config = loadConfig();

    // 2. 初始化命令执行器
    const executor = new CommandExecutor(config);

    // 3. 创建工具注册表并注册所有工具
    const registry = new ToolRegistry();
    registry.registerAll(ALL_TOOLS);

    // 4. 创建 MCP Server
    const server = new Server(
        {
            name: config.serverName,
            version: config.serverVersion,
        },
        {
            capabilities: {
                tools: {},
            },
        },
    );

    // 5. 注册 tools/list 处理器
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        return { tools: registry.listAll() };
    });

    // 6. 注册 tools/call 处理器
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;

        try {
            const result = await registry.dispatch(name, args ?? {}, executor);
            return {
                content: result.content.map((c) => ({ type: c.type as 'text', text: c.text })),
                isError: result.isError,
            };
        } catch (error) {
            return handleToolError(error, name);
        }
    });

    // 7. 建立 stdio 传输并连接
    const transport = new StdioServerTransport();
    await server.connect(transport);

    // 日志输出到 stderr（不干扰 MCP 通信）
    console.error(`[${config.serverName}] Server started (v${config.serverVersion})`);
    console.error(`[${config.serverName}] Registered ${registry.size} tools`);
    console.error(`[${config.serverName}] OpenCode path: ${config.opencodePath}`);
    console.error(`[${config.serverName}] Timeout: ${config.timeoutMs}ms`);
}

/**
 * 统一错误处理器
 * 
 * @param error - 捕获的异常
 * @param toolName - 触发异常的工具名称
 * @returns MCP 错误响应
 */
function handleToolError(
    error: unknown,
    toolName: string,
): { content: Array<{ type: string; text: string }>; isError: boolean } {
    let message: string;

    if (error instanceof ExecutionTimeoutError) {
        message = `Tool "${toolName}" timed out: ${error.message}`;
    } else if (error instanceof Error) {
        message = `Tool "${toolName}" failed: ${error.message}`;
    } else {
        message = `Tool "${toolName}" encountered an unknown error: ${String(error)}`;
    }

    console.error(`[opencode-mcp-server] Error in ${toolName}:`, error);

    return {
        content: [{ type: 'text', text: message }],
        isError: true,
    };
}

// 启动
main().catch((error) => {
    console.error('[opencode-mcp-server] Fatal error:', error);
    process.exit(1);
});
