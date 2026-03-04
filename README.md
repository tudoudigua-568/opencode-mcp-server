# OpenCode MCP Server

**中文** | [English](./README_EN.md)

> 通过 MCP 协议将 OpenCode CLI 的 **全部** AI 编码能力暴露为标准化工具服务，支持 oh-my-opencode 多代理编排和 superpower skill 技能系统。

## 架构

```text
OpenClaw (MCP Client) → [MCP Protocol / stdio] → opencode-mcp-server (适配器) → [子进程] → opencode CLI → LLM
```

**设计模式**：适配器模式 + 注册表模式 + 策略模式 + 开闭原则

## 快速开始

### 前置条件

- [Node.js](https://nodejs.org/) >= 18.0.0
- [OpenCode CLI](https://opencode.ai/) 已安装并配置好 LLM 凭据
- （可选）[oh-my-opencode](https://github.com/pinkpixel-dev/oh-my-opencode) 多代理插件
- （可选）[superpower](https://github.com/pinkpixel-dev/superpowers-opencode) 技能系统

### 安装与构建

```bash
cd d:\mcp\opencode-mcp-server
npm install
npm run build
```

## 21 个 MCP 工具

### 核心（3）

| 工具 | 说明 |
|------|------|
| `opencode_run` | 执行 AI 编码 prompt（非交互模式） |
| `opencode_models` | 列出可用 LLM 模型 |
| `opencode_auth` | 查看认证状态 |

### Session 管理（4）

| 工具 | 说明 |
|------|------|
| `opencode_session_list` | 列出所有会话 |
| `opencode_session_continue` | 继续已有会话 |
| `opencode_session_export` | 导出会话记录 |
| `opencode_session_fork` | 分叉会话 |

### Agent 管理（3）

| 工具 | 说明 |
|------|------|
| `opencode_agent_list` | 列出所有代理 |
| `opencode_agent_create` | 创建自定义代理 |
| `opencode_agent_run` | 用指定代理执行 |

### 自定义命令（1）

| 工具 | 说明 |
|------|------|
| `opencode_command_run` | 执行 slash 命令 |

### 服务模式（2）

| 工具 | 说明 |
|------|------|
| `opencode_serve_start` | 启动 HTTP/Web 服务器 |
| `opencode_serve_status` | 检测服务器运行状态 |

### oh-my-opencode 多代理（3）

| 工具 | 说明 |
|------|------|
| `opencode_sisyphus` | Sisyphus 编排（规划→委派→执行→验证） |
| `opencode_prometheus` | Prometheus 咨询（分析→规划） |
| `opencode_subagent` | 异步子代理调用 |

### superpower skill（2）

| 工具 | 说明 |
|------|------|
| `opencode_skill_list` | 列出可用技能 |
| `opencode_skill_use` | 激活并使用技能 |

### Stop Hook 任务回调（3）

| 工具 | 说明 |
|------|------|
| `opencode_hook_dispatch` | 派发 OpenCode 任务（自动回调） |
| `opencode_hook_result` | 读取 Stop Hook 结果（latest.json） |
| `opencode_hook_wake` | 读取/处理唤醒文件（pending-wake.json） |

## OpenClaw 配置

```json
{
  "mcpServers": {
    "opencode-adapter": {
      "type": "stdio",
      "command": "node",
      "args": ["D:/mcp/opencode-mcp-server/dist/index.js"],
      "env": {
        "OPENCODE_TIMEOUT_MS": "120000",
        "OPENCODE_WORKSPACE": "D:/projects"
      }
    }
  }
}
```

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `OPENCODE_PATH` | `opencode` | CLI 路径 |
| `OPENCODE_TIMEOUT_MS` | `120000` | 超时（毫秒） |
| `OPENCODE_WORKSPACE` | `.` | 默认工作目录 |
| `OPENCODE_MODEL` | (空) | 默认模型 |
| `OPENCODE_MAX_OUTPUT` | `10485760` | 最大输出（字节） |
| `HOOK_RESULT_DIR` | `~/opencode-data/hook-results` | Hook 结果文件目录 |

## 项目结构

```text
opencode-mcp-server/
├── src/
│   ├── index.ts                    # MCP Server 入口
│   ├── config.ts                   # 配置管理
│   ├── executor.ts                 # 命令执行器（适配器核心）
│   ├── tool-definition.ts          # 工具接口定义
│   ├── tool-registry.ts            # 工具注册表
│   ├── tools/
│   │   ├── index.ts                # 工具索引（集中注册）
│   │   ├── opencode-run.ts         # 核心：AI 编码
│   │   ├── opencode-models.ts      # 核心：模型列表
│   │   ├── opencode-auth.ts        # 核心：认证
│   │   ├── opencode-session-*.ts   # Session 管理（4个）
│   │   ├── opencode-agent-*.ts     # Agent 管理（3个）
│   │   ├── opencode-command-run.ts # 自定义命令
│   │   ├── opencode-serve.ts       # 服务模式（2个）
│   │   ├── opencode-omoc.ts        # oh-my-opencode（3个）
│   │   ├── opencode-skills.ts      # superpower（2个）
│   │   └── opencode-hooks.ts       # Stop Hook 任务回调（3个）
│   └── __tests__/                  # 单元测试
├── package.json
├── tsconfig.json
└── README.md
```

## 开发

```bash
npm run dev      # 监听模式构建
npm test         # 运行测试
npm run lint     # 类型检查
```

---

**Author**: shichao.han | **Version**: 1.1.0 | **License**: MIT
