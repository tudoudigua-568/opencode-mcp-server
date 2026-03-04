# OpenCode MCP Server

[中文](./README.md) | **English**

> Expose **all** AI coding capabilities of the OpenCode CLI as standardized tool services via the MCP protocol. Supports oh-my-opencode multi-agent orchestration and superpower skill system.

## Architecture

```text
OpenClaw (MCP Client) → [MCP Protocol / stdio] → opencode-mcp-server (Adapter) → [Subprocess] → opencode CLI → LLM
```

**Design Patterns**: Adapter Pattern + Registry Pattern + Strategy Pattern + Open/Closed Principle

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18.0.0
- [OpenCode CLI](https://opencode.ai/) installed with LLM credentials configured
- (Optional) [oh-my-opencode](https://github.com/pinkpixel-dev/oh-my-opencode) multi-agent plugin
- (Optional) [superpower](https://github.com/pinkpixel-dev/superpowers-opencode) skill system

### Installation & Build

```bash
cd d:\mcp\opencode-mcp-server
npm install
npm run build
```

## 21 MCP Tools

### Core (3)

| Tool | Description |
|------|-------------|
| `opencode_run` | Execute AI coding prompt (non-interactive mode) |
| `opencode_models` | List available LLM models |
| `opencode_auth` | View authentication status |

### Session Management (4)

| Tool | Description |
|------|-------------|
| `opencode_session_list` | List all sessions |
| `opencode_session_continue` | Continue an existing session |
| `opencode_session_export` | Export session records |
| `opencode_session_fork` | Fork a session |

### Agent Management (3)

| Tool | Description |
|------|-------------|
| `opencode_agent_list` | List all agents |
| `opencode_agent_create` | Create a custom agent |
| `opencode_agent_run` | Execute with a specified agent |

### Custom Commands (1)

| Tool | Description |
|------|-------------|
| `opencode_command_run` | Execute a slash command |

### Serve Mode (2)

| Tool | Description |
|------|-------------|
| `opencode_serve_start` | Start HTTP/Web server |
| `opencode_serve_status` | Check server running status |

### oh-my-opencode Multi-Agent (3)

| Tool | Description |
|------|-------------|
| `opencode_sisyphus` | Sisyphus orchestration (Plan → Delegate → Execute → Verify) |
| `opencode_prometheus` | Prometheus consultation (Analyze → Plan) |
| `opencode_subagent` | Asynchronous sub-agent invocation |

### Superpower Skill (2)

| Tool | Description |
|------|-------------|
| `opencode_skill_list` | List available skills |
| `opencode_skill_use` | Activate and use a skill |

### Stop Hook — Task Callback (3)

| Tool | Description |
|------|-------------|
| `opencode_hook_dispatch` | Dispatch an OpenCode task with auto-callback |
| `opencode_hook_result` | Read Stop Hook result (latest.json) |
| `opencode_hook_wake` | Read/process wake file (pending-wake.json) |

## OpenClaw Configuration

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

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENCODE_PATH` | `opencode` | CLI executable path |
| `OPENCODE_TIMEOUT_MS` | `120000` | Timeout (milliseconds) |
| `OPENCODE_WORKSPACE` | `.` | Default working directory |
| `OPENCODE_MODEL` | (empty) | Default model |
| `OPENCODE_MAX_OUTPUT` | `10485760` | Max output size (bytes) |
| `HOOK_RESULT_DIR` | `~/opencode-data/hook-results` | Hook result file directory |

## Project Structure

```text
opencode-mcp-server/
├── src/
│   ├── index.ts                    # MCP Server entry point
│   ├── config.ts                   # Configuration management
│   ├── executor.ts                 # Command executor (adapter core)
│   ├── tool-definition.ts          # Tool interface definitions
│   ├── tool-registry.ts            # Tool registry
│   ├── tools/
│   │   ├── index.ts                # Tool index (centralized registration)
│   │   ├── opencode-run.ts         # Core: AI coding
│   │   ├── opencode-models.ts      # Core: model listing
│   │   ├── opencode-auth.ts        # Core: authentication
│   │   ├── opencode-session-*.ts   # Session management (4 tools)
│   │   ├── opencode-agent-*.ts     # Agent management (3 tools)
│   │   ├── opencode-command-run.ts # Custom commands
│   │   ├── opencode-serve.ts       # Serve mode (2 tools)
│   │   ├── opencode-omoc.ts        # oh-my-opencode (3 tools)
│   │   ├── opencode-skills.ts      # superpower (2 tools)
│   │   └── opencode-hooks.ts       # Stop Hook callback (3 tools)
│   └── __tests__/                  # Unit tests
├── package.json
├── tsconfig.json
└── README.md
```

## Development

```bash
npm run dev      # Watch mode build
npm test         # Run tests
npm run lint     # Type checking
```

---

**Author**: shichao.han | **Version**: 1.1.0 | **License**: MIT
