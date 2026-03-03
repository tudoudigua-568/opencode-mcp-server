/**
 * OpenCode MCP Server - 工具定义接口
 * 定义所有 MCP 工具必须实现的统一接口
 * 
 * 设计模式：策略模式 + 接口隔离原则
 * 每个工具独立实现此接口，ToolRegistry 负责统一管理
 *
 * @author shichao.han
 * @version 1.1.0
 * @date 2026/02/13 13:43
 */

import { type CommandExecutor } from './executor.js';

/**
 * MCP 工具执行结果
 * 符合 MCP 协议的工具调用返回格式
 */
export interface ToolResult {
    /** 返回内容数组 */
    content: Array<{ type: string; text: string }>;
    /** 是否为错误结果 */
    isError?: boolean;
}

/**
 * MCP 工具定义接口
 * 所有工具必须实现此接口，确保注册和调用的一致性
 * 
 * 接口隔离原则：只暴露工具注册和执行所必需的方法
 */
export interface ToolDefinition {
    /** 工具唯一标识符（不可重复） */
    readonly name: string;

    /** 工具描述（供 MCP 客户端展示） */
    readonly description: string;

    /**
     * 获取输入参数的 JSON Schema
     * 用于 MCP tools/list 响应和客户端参数验证
     */
    getInputSchema(): Record<string, unknown>;

    /**
     * 执行工具逻辑
     * 
     * @param executor - 命令执行器
     * @param args - 客户端传入的参数（已通过 Schema 初步验证）
     * @returns 工具执行结果
     */
    execute(executor: CommandExecutor, args: Record<string, unknown>): Promise<ToolResult>;
}
