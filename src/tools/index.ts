/**
 * OpenCode MCP Server - 工具索引
 * 集中导出所有工具定义，供 ToolRegistry 批量注册
 *
 * 开闭原则：新增工具只需在此文件导入并添加到数组
 *
 * @author shichao.han
 * @version 1.1.0
 * @date 2026/02/13 13:43
 */

import { type ToolDefinition } from '../tool-definition.js';

// 核心工具
import { opencodeRunTool } from './opencode-run.js';
import { opencodeModelsTool } from './opencode-models.js';
import { opencodeAuthTool } from './opencode-auth.js';

// Session 管理工具
import { opencodeSessionListTool } from './opencode-session-list.js';
import { opencodeSessionContinueTool } from './opencode-session-continue.js';
import { opencodeSessionExportTool } from './opencode-session-export.js';
import { opencodeSessionForkTool } from './opencode-session-fork.js';

// Agent 管理工具
import { opencodeAgentListTool } from './opencode-agent-list.js';
import { opencodeAgentCreateTool } from './opencode-agent-create.js';
import { opencodeAgentRunTool } from './opencode-agent-run.js';

// 自定义命令
import { opencodeCommandRunTool } from './opencode-command-run.js';

// 服务模式
import { opencodeServeStartTool, opencodeServeStatusTool } from './opencode-serve.js';

// oh-my-opencode 多代理编排
import { opencodeSisyphusTool, opencodePrometheusTool, opencodeSubagentTool } from './opencode-omoc.js';
import { opencodeBrainstormRalphTool } from './opencode-brainstorm-ralph.js';

// superpower skill 技能系统
import { opencodeSkillListTool, opencodeSkillUseTool } from './opencode-skills.js';

// Stop Hook 任务回调
import { opencodeHookDispatchTool, opencodeHookResultTool, opencodeHookWakeTool } from './opencode-hooks.js';

/**
 * 所有可用工具列表
 * 新增工具时在此处添加即可自动注册到 MCP Server
 */
export const ALL_TOOLS: ToolDefinition[] = [
    // === 核心 ===
    opencodeRunTool,
    opencodeModelsTool,
    opencodeAuthTool,

    // === Session 管理 ===
    opencodeSessionListTool,
    opencodeSessionContinueTool,
    opencodeSessionExportTool,
    opencodeSessionForkTool,

    // === Agent 管理 ===
    opencodeAgentListTool,
    opencodeAgentCreateTool,
    opencodeAgentRunTool,

    // === 自定义命令 ===
    opencodeCommandRunTool,

    // === 服务模式 ===
    opencodeServeStartTool,
    opencodeServeStatusTool,

    // === oh-my-opencode ===
    opencodeSisyphusTool,
    opencodePrometheusTool,
    opencodeSubagentTool,
    opencodeBrainstormRalphTool,

    // === superpower skill ===
    opencodeSkillListTool,
    opencodeSkillUseTool,

    // === Stop Hook 任务回调 ===
    opencodeHookDispatchTool,
    opencodeHookResultTool,
    opencodeHookWakeTool,
];
