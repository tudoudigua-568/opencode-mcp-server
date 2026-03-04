/**
 * OpenCode MCP Server - 工具注册表和工具定义验证测试
 * 验证 ToolRegistry 机制和所有 18 个工具的注册正确性
 *
 * @author shichao.han
 * @version 1.1.0
 * @date 2026/02/13 13:43
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ToolRegistry } from '../tool-registry.js';
import { ALL_TOOLS } from '../tools/index.js';
import type { ToolDefinition, ToolResult } from '../tool-definition.js';
import type { CommandExecutor } from '../executor.js';

describe('ToolRegistry', () => {
    let registry: ToolRegistry;

    beforeEach(() => {
        registry = new ToolRegistry();
    });

    it('应正确注册单个工具', () => {
        const mockTool: ToolDefinition = {
            name: 'test_tool',
            description: 'A test tool',
            getInputSchema: () => ({ type: 'object', properties: {}, required: [] }),
            execute: async () => ({ content: [{ type: 'text', text: 'ok' }] }),
        };
        registry.register(mockTool);
        expect(registry.size).toBe(1);
        expect(registry.has('test_tool')).toBe(true);
    });

    it('应拒绝重复注册', () => {
        const mockTool: ToolDefinition = {
            name: 'dup_tool',
            description: 'Duplicate',
            getInputSchema: () => ({ type: 'object', properties: {}, required: [] }),
            execute: async () => ({ content: [{ type: 'text', text: 'ok' }] }),
        };
        registry.register(mockTool);
        expect(() => registry.register(mockTool)).toThrow('already registered');
    });

    it('应正确列出所有工具', () => {
        const tool1: ToolDefinition = {
            name: 'tool_a',
            description: 'Tool A',
            getInputSchema: () => ({ type: 'object', properties: {}, required: [] }),
            execute: async () => ({ content: [{ type: 'text', text: 'a' }] }),
        };
        const tool2: ToolDefinition = {
            name: 'tool_b',
            description: 'Tool B',
            getInputSchema: () => ({ type: 'object', properties: { x: { type: 'string' } }, required: ['x'] }),
            execute: async () => ({ content: [{ type: 'text', text: 'b' }] }),
        };
        registry.registerAll([tool1, tool2]);
        const list = registry.listAll();
        expect(list).toHaveLength(2);
        expect(list[0].name).toBe('tool_a');
        expect(list[1].name).toBe('tool_b');
    });

    it('dispatch 应对未知工具返回错误', async () => {
        const result = await registry.dispatch('nonexistent', {}, {} as CommandExecutor);
        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('Unknown tool');
    });

    it('dispatch 应正确路由到工具', async () => {
        const mockTool: ToolDefinition = {
            name: 'dispatch_test',
            description: 'Dispatch test',
            getInputSchema: () => ({ type: 'object', properties: {}, required: [] }),
            execute: async (_executor, args) => ({
                content: [{ type: 'text', text: `dispatched: ${JSON.stringify(args)}` }],
            }),
        };
        registry.register(mockTool);
        const result = await registry.dispatch('dispatch_test', { key: 'value' }, {} as CommandExecutor);
        expect(result.content[0].text).toContain('dispatched');
        expect(result.content[0].text).toContain('value');
    });
});

describe('ALL_TOOLS 集成验证', () => {
    it('应包含 21 个工具', () => {
        expect(ALL_TOOLS).toHaveLength(21);
    });

    it('所有工具名称应唯一', () => {
        const names = ALL_TOOLS.map((t) => t.name);
        const uniqueNames = new Set(names);
        expect(uniqueNames.size).toBe(names.length);
    });

    it('所有工具应有非空描述', () => {
        for (const tool of ALL_TOOLS) {
            expect(tool.description.length).toBeGreaterThan(10);
        }
    });

    it('所有工具的 inputSchema 应为合法对象', () => {
        for (const tool of ALL_TOOLS) {
            const schema = tool.getInputSchema();
            expect(schema.type).toBe('object');
            expect(schema).toHaveProperty('properties');
        }
    });

    it('应可批量注册到 ToolRegistry', () => {
        const registry = new ToolRegistry();
        registry.registerAll(ALL_TOOLS);
        expect(registry.size).toBe(21);
    });

    it('工具名称列表应包含全部预期工具', () => {
        const names = ALL_TOOLS.map((t) => t.name);

        // 核心
        expect(names).toContain('opencode_run');
        expect(names).toContain('opencode_models');
        expect(names).toContain('opencode_auth');

        // Session
        expect(names).toContain('opencode_session_list');
        expect(names).toContain('opencode_session_continue');
        expect(names).toContain('opencode_session_export');
        expect(names).toContain('opencode_session_fork');

        // Agent
        expect(names).toContain('opencode_agent_list');
        expect(names).toContain('opencode_agent_create');
        expect(names).toContain('opencode_agent_run');

        // Command
        expect(names).toContain('opencode_command_run');

        // Serve
        expect(names).toContain('opencode_serve_start');
        expect(names).toContain('opencode_serve_status');

        // oh-my-opencode
        expect(names).toContain('opencode_sisyphus');
        expect(names).toContain('opencode_prometheus');
        expect(names).toContain('opencode_subagent');

        // superpower
        expect(names).toContain('opencode_skill_list');
        expect(names).toContain('opencode_skill_use');

        // Stop Hook
        expect(names).toContain('opencode_hook_dispatch');
        expect(names).toContain('opencode_hook_result');
        expect(names).toContain('opencode_hook_wake');
    });
});
