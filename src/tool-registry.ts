/**
 * OpenCode MCP Server - 工具注册表
 * 注册表模式：统一管理所有 MCP 工具的注册、发现和调用路由
 * 
 * 设计模式：
 * - 注册表模式（Registry Pattern）：集中管理工具实例
 * - 单一职责：仅负责工具的注册和路由分发
 * - 开闭原则：新增工具只需注册，无需修改路由逻辑
 *
 * @author shichao.han
 * @version 1.1.0
 * @date 2026/02/13 13:43
 */

import { type ToolDefinition, type ToolResult } from './tool-definition.js';
import { type CommandExecutor } from './executor.js';

/**
 * 工具注册表
 * 集中管理所有 MCP 工具的生命周期
 */
export class ToolRegistry {
    /** 工具映射：name → ToolDefinition */
    private readonly tools: Map<string, ToolDefinition> = new Map();

    /**
     * 注册一个工具
     * 
     * @param tool - 工具定义实例
     * @throws Error 如果工具名称已存在
     */
    register(tool: ToolDefinition): void {
        if (this.tools.has(tool.name)) {
            throw new Error(`Tool "${tool.name}" is already registered`);
        }
        this.tools.set(tool.name, tool);
    }

    /**
     * 批量注册工具
     * 
     * @param tools - 工具定义实例数组
     */
    registerAll(tools: ToolDefinition[]): void {
        for (const tool of tools) {
            this.register(tool);
        }
    }

    /**
     * 获取所有已注册工具的列表（用于 tools/list 响应）
     * 
     * @returns MCP 工具列表格式
     */
    listAll(): Array<{
        name: string;
        description: string;
        inputSchema: Record<string, unknown>;
    }> {
        return Array.from(this.tools.values()).map((tool) => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.getInputSchema(),
        }));
    }

    /**
     * 分发工具调用请求到对应工具实现
     * 
     * @param name - 工具名称
     * @param args - 调用参数
     * @param executor - 命令执行器
     * @returns 工具执行结果
     */
    async dispatch(
        name: string,
        args: Record<string, unknown>,
        executor: CommandExecutor,
    ): Promise<ToolResult> {
        const tool = this.tools.get(name);
        if (!tool) {
            const available = Array.from(this.tools.keys()).join(', ');
            return {
                content: [{
                    type: 'text',
                    text: `Unknown tool: "${name}". Available tools: ${available}`,
                }],
                isError: true,
            };
        }

        return tool.execute(executor, args);
    }

    /**
     * 获取已注册工具数量
     */
    get size(): number {
        return this.tools.size;
    }

    /**
     * 检查工具是否已注册
     */
    has(name: string): boolean {
        return this.tools.has(name);
    }
}
