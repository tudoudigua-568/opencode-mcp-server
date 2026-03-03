/**
 * OpenCode MCP Server - 配置管理单元测试
 * 验证配置加载、环境变量覆盖和默认值回退
 *
 * @author shichao.han
 * @version 1.0.0
 * @date 2026/02/13 12:05
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig } from '../config.js';

describe('loadConfig', () => {
    /** 保存原始环境变量 */
    const originalEnv = { ...process.env };

    afterEach(() => {
        // 恢复环境变量
        process.env = { ...originalEnv };
    });

    it('应返回默认配置', () => {
        const config = loadConfig();
        expect(config.opencodePath).toBe('opencode');
        expect(config.timeoutMs).toBe(120_000);
        expect(config.defaultWorkspace).toBe('.');
        expect(config.defaultModel).toBe('');
        expect(config.serverName).toBe('opencode-mcp-server');
        expect(config.serverVersion).toBe('1.0.0');
    });

    it('应从环境变量覆盖 opencodePath', () => {
        process.env['OPENCODE_PATH'] = '/usr/local/bin/opencode';
        const config = loadConfig();
        expect(config.opencodePath).toBe('/usr/local/bin/opencode');
    });

    it('应从环境变量覆盖 timeoutMs', () => {
        process.env['OPENCODE_TIMEOUT_MS'] = '60000';
        const config = loadConfig();
        expect(config.timeoutMs).toBe(60000);
    });

    it('应在 timeoutMs 无效时使用默认值', () => {
        process.env['OPENCODE_TIMEOUT_MS'] = 'not-a-number';
        const config = loadConfig();
        expect(config.timeoutMs).toBe(120_000);
    });

    it('应从环境变量覆盖 workspace', () => {
        process.env['OPENCODE_WORKSPACE'] = 'D:\\projects';
        const config = loadConfig();
        expect(config.defaultWorkspace).toBe('D:\\projects');
    });

    it('应从环境变量覆盖 model', () => {
        process.env['OPENCODE_MODEL'] = 'anthropic/claude-sonnet-4-20250514';
        const config = loadConfig();
        expect(config.defaultModel).toBe('anthropic/claude-sonnet-4-20250514');
    });

    it('返回的配置应为冻结对象（不可变）', () => {
        const config = loadConfig();
        expect(Object.isFrozen(config)).toBe(true);
    });
});
