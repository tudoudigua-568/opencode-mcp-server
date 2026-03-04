/**
 * OpenCode MCP Server - 配置管理模块
 * 集中管理服务器运行配置，支持环境变量覆盖
 *
 * @author shichao.han
 * @version 1.0.0
 * @date 2026/02/13 12:05
 */

/**
 * 服务器配置接口
 * 定义所有可配置项的类型约束
 */
export interface ServerConfig {
    /** OpenCode CLI 可执行文件路径 */
    readonly opencodePath: string;
    /** 命令执行超时时间（毫秒） */
    readonly timeoutMs: number;
    /** 默认工作目录 */
    readonly defaultWorkspace: string;
    /** 默认模型标识符 */
    readonly defaultModel: string;
    /** 最大输出缓冲区大小（字节） */
    readonly maxOutputBytes: number;
    /** 服务器名称 */
    readonly serverName: string;
    /** 服务器版本 */
    readonly serverVersion: string;
    /** Stop Hook 结果文件目录 */
    readonly hookResultDir: string;
}

/**
 * 默认配置常量
 * 所有默认值均可通过环境变量覆盖
 */
const DEFAULT_CONFIG: ServerConfig = {
    opencodePath: 'opencode',
    timeoutMs: 120_000,
    defaultWorkspace: '.',
    defaultModel: '',
    maxOutputBytes: 10 * 1024 * 1024, // 10 MB
    serverName: 'opencode-mcp-server',
    serverVersion: '1.0.0',
    hookResultDir: './data/open-code-results',
};

/**
 * 从环境变量加载配置，与默认值合并
 * 
 * 环境变量映射：
 * - OPENCODE_PATH       → opencodePath
 * - OPENCODE_TIMEOUT_MS → timeoutMs
 * - OPENCODE_WORKSPACE  → defaultWorkspace
 * - OPENCODE_MODEL      → defaultModel
 * - OPENCODE_MAX_OUTPUT  → maxOutputBytes
 * - HOOK_RESULT_DIR     → hookResultDir
 *
 * @returns 已合并的最终配置（不可变）
 */
export function loadConfig(): Readonly<ServerConfig> {
    const env = process.env;

    return Object.freeze({
        opencodePath: env['OPENCODE_PATH'] ?? DEFAULT_CONFIG.opencodePath,
        timeoutMs: parseIntOrDefault(env['OPENCODE_TIMEOUT_MS'], DEFAULT_CONFIG.timeoutMs),
        defaultWorkspace: env['OPENCODE_WORKSPACE'] ?? DEFAULT_CONFIG.defaultWorkspace,
        defaultModel: env['OPENCODE_MODEL'] ?? DEFAULT_CONFIG.defaultModel,
        maxOutputBytes: parseIntOrDefault(env['OPENCODE_MAX_OUTPUT'], DEFAULT_CONFIG.maxOutputBytes),
        serverName: DEFAULT_CONFIG.serverName,
        serverVersion: DEFAULT_CONFIG.serverVersion,
        hookResultDir: env['HOOK_RESULT_DIR'] ?? DEFAULT_CONFIG.hookResultDir,
    });
}

/**
 * 安全解析整数，解析失败时返回默认值
 *
 * @param value - 待解析的字符串
 * @param defaultValue - 解析失败时的回退值
 * @returns 解析结果或默认值
 */
function parseIntOrDefault(value: string | undefined, defaultValue: number): number {
    if (value === undefined) return defaultValue;
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? defaultValue : parsed;
}
