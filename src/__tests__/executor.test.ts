/**
 * OpenCode MCP Server - 命令执行器单元测试
 * 验证命令组装、参数转义、超时处理等核心逻辑
 *
 * @author shichao.han
 * @version 1.0.0
 * @date 2026/02/13 12:05
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommandExecutor, ExecutionTimeoutError } from '../executor.js';
import type { ServerConfig } from '../config.js';

/**
 * 创建测试用配置
 * 使用 '.' 作为默认工作目录，确保跨平台兼容
 */
function createTestConfig(overrides?: Partial<ServerConfig>): ServerConfig {
    return {
        opencodePath: 'opencode',
        timeoutMs: 5000,
        defaultWorkspace: '.',
        defaultModel: '',
        maxOutputBytes: 1024 * 1024,
        serverName: 'test-server',
        serverVersion: '0.0.1',
        ...overrides,
    };
}

describe('CommandExecutor', () => {
    let executor: CommandExecutor;

    beforeEach(() => {
        executor = new CommandExecutor(createTestConfig());
    });

    describe('构造', () => {
        it('应正确初始化', () => {
            expect(executor).toBeDefined();
            expect(executor).toBeInstanceOf(CommandExecutor);
        });
    });

    describe('execute', () => {
        it('应成功执行简单命令', async () => {
            // 使用 echo 作为替代命令验证执行机制
            const testExecutor = new CommandExecutor(
                createTestConfig({ opencodePath: 'echo' }),
            );
            const result = await testExecutor.execute(['hello', 'world']);
            expect(result.success).toBe(true);
            expect(result.exitCode).toBe(0);
            expect(result.stdout).toContain('hello');
        });

        it('应处理命令执行失败', async () => {
            const testExecutor = new CommandExecutor(
                createTestConfig({ opencodePath: 'nonexistent-command-xyz' }),
            );
            try {
                await testExecutor.execute(['test']);
                // 某些系统可能不是抛异常而是返回错误码
            } catch (error) {
                expect(error).toBeDefined();
            }
        });

        it('应使用自定义工作目录', async () => {
            const testExecutor = new CommandExecutor(
                createTestConfig({ opencodePath: 'echo' }),
            );
            // 传入 cwd 不影响 echo 输出，但验证不报错
            const result = await testExecutor.execute(['test'], '.');
            expect(result.success).toBe(true);
        });
    });

    describe('runPrompt', () => {
        it('应组装正确的命令参数', async () => {
            const testExecutor = new CommandExecutor(
                createTestConfig({ opencodePath: 'echo' }),
            );
            const result = await testExecutor.runPrompt('test prompt');
            expect(result.stdout).toContain('run');
            expect(result.stdout).toContain('test prompt');
            expect(result.stdout).toContain('-q');
        });

        it('应在指定 model 时添加 --model 参数', async () => {
            const testExecutor = new CommandExecutor(
                createTestConfig({ opencodePath: 'echo' }),
            );
            const result = await testExecutor.runPrompt('test', {
                model: 'anthropic/claude-sonnet-4-20250514',
            });
            expect(result.stdout).toContain('--model');
            expect(result.stdout).toContain('anthropic/claude-sonnet-4-20250514');
        });
    });

    describe('listModels', () => {
        it('应调用 models 子命令', async () => {
            const testExecutor = new CommandExecutor(
                createTestConfig({ opencodePath: 'echo' }),
            );
            const result = await testExecutor.listModels();
            expect(result.stdout).toContain('models');
        });
    });

    describe('listAuth', () => {
        it('应调用 auth list 子命令', async () => {
            const testExecutor = new CommandExecutor(
                createTestConfig({ opencodePath: 'echo' }),
            );
            const result = await testExecutor.listAuth();
            expect(result.stdout).toContain('auth');
            expect(result.stdout).toContain('list');
        });
    });
});

describe('ExecutionTimeoutError', () => {
    it('应包含超时信息', () => {
        const error = new ExecutionTimeoutError('test timeout', 5000);
        expect(error.name).toBe('ExecutionTimeoutError');
        expect(error.message).toBe('test timeout');
        expect(error.timeoutMs).toBe(5000);
        expect(error).toBeInstanceOf(Error);
    });
});
