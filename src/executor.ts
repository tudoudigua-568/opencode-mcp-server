/**
 * OpenCode MCP Server - 命令执行器模块
 * 适配器模式核心：封装子进程执行 OpenCode CLI 命令
 * 提供超时控制、错误处理、输出截断等能力
 *
 * @author shichao.han
 * @version 1.0.0
 * @date 2026/02/13 12:05
 */

import { exec, type ExecException } from 'node:child_process';
import { type ServerConfig } from './config.js';

/**
 * 命令执行结果
 * 封装 CLI 执行的标准输出和标准错误
 */
export interface ExecutionResult {
    /** 标准输出内容 */
    readonly stdout: string;
    /** 标准错误内容 */
    readonly stderr: string;
    /** 退出码 */
    readonly exitCode: number;
    /** 执行是否成功（exitCode === 0） */
    readonly success: boolean;
}

/**
 * 命令执行器
 * 负责组装 OpenCode CLI 命令并通过子进程执行
 * 
 * 设计决策：
 * - 使用 exec 而非 spawn，因为 opencode run 是一次性命令
 * - exec 在 Windows 上默认通过 cmd.exe 执行，无需额外 shell 配置
 * - 输出截断防止内存溢出
 */
export class CommandExecutor {
    /** 服务器配置引用 */
    private readonly config: ServerConfig;

    /**
     * @param config - 服务器配置
     */
    constructor(config: ServerConfig) {
        this.config = config;
    }

    /**
     * 执行 OpenCode CLI 命令
     * 
     * @param args - 命令行参数数组
     * @param cwd - 工作目录（可选，默认使用配置中的 defaultWorkspace）
     * @returns 执行结果
     * @throws Error 当命令超时时抛出
     */
    async execute(args: string[], cwd?: string): Promise<ExecutionResult> {
        const command = this.buildCommand(args);
        const workDir = cwd ?? this.config.defaultWorkspace;

        return new Promise<ExecutionResult>((resolve, reject) => {
            const childProcess = exec(
                command,
                {
                    cwd: workDir,
                    timeout: this.config.timeoutMs,
                    maxBuffer: this.config.maxOutputBytes,
                    env: { ...process.env },
                },
                (error: ExecException | null, stdout: string, stderr: string) => {
                    if (error && 'killed' in error && error.killed) {
                        reject(new ExecutionTimeoutError(
                            `OpenCode 命令执行超时（${this.config.timeoutMs}ms）: ${command}`,
                            this.config.timeoutMs,
                        ));
                        return;
                    }

                    const exitCode = error?.code as number ?? 0;

                    resolve({
                        stdout: truncateOutput(stdout, this.config.maxOutputBytes),
                        stderr: truncateOutput(stderr, this.config.maxOutputBytes),
                        exitCode,
                        success: exitCode === 0,
                    });
                },
            );

            // 防止子进程阻止 Node 退出
            childProcess.unref();
        });
    }

    /**
     * 执行 opencode run 命令（非交互模式）
     *
     * @param prompt - 用户提示词
     * @param options - 可选参数
     * @returns 执行结果
     */
    async runPrompt(
        prompt: string,
        options?: {
            workspace?: string;
            model?: string;
            quiet?: boolean;
        },
    ): Promise<ExecutionResult> {
        const args: string[] = ['run', `"${escapeShellArg(prompt)}"`];

        if (options?.model) {
            args.push('--model', options.model);
        }

        if (options?.quiet !== false) {
            args.push('-q'); // 默认静默模式，不显示 spinner
        }

        return this.execute(args, options?.workspace);
    }

    /**
     * 列出可用模型
     *
     * @returns 执行结果（stdout 包含模型列表）
     */
    async listModels(): Promise<ExecutionResult> {
        return this.execute(['models']);
    }

    /**
     * 列出认证信息
     *
     * @returns 执行结果（stdout 包含已配置的凭据）
     */
    async listAuth(): Promise<ExecutionResult> {
        return this.execute(['auth', 'list']);
    }

    /**
     * 组装完整命令字符串
     *
     * @param args - 命令行参数
     * @returns 完整命令字符串
     */
    private buildCommand(args: string[]): string {
        return `${this.config.opencodePath} ${args.join(' ')}`;
    }
}

/**
 * 命令执行超时错误
 * 当 OpenCode CLI 执行超过配置的超时时间时抛出
 */
export class ExecutionTimeoutError extends Error {
    /** 超时时间（毫秒） */
    readonly timeoutMs: number;

    constructor(message: string, timeoutMs: number) {
        super(message);
        this.name = 'ExecutionTimeoutError';
        this.timeoutMs = timeoutMs;
    }
}

/**
 * 转义 Shell 参数中的特殊字符
 * 防止命令注入
 *
 * @param arg - 原始参数
 * @returns 转义后的参数
 */
function escapeShellArg(arg: string): string {
    // 转义双引号和反斜杠
    return arg.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * 截断过长的输出内容
 * 防止巨量输出导致内存问题
 *
 * @param output - 原始输出
 * @param maxBytes - 最大字节数
 * @returns 截断后的输出（如有截断会附加提示）
 */
function truncateOutput(output: string, maxBytes: number): string {
    if (Buffer.byteLength(output) <= maxBytes) {
        return output;
    }
    const truncated = output.slice(0, maxBytes);
    return `${truncated}\n\n[--- 输出已截断，超过 ${Math.round(maxBytes / 1024)}KB 限制 ---]`;
}
