---
name: opencode-mcp-adapter
description: >
  Use OpenCode AI coding capabilities via MCP protocol.
  Provides 21 tools covering AI coding, session management, agent orchestration,
  skill system, and task callback hooks. Cross-platform (Windows/Linux/macOS).
version: 1.1.0
author: shichao.han
metadata:
  openclaw:
    requires:
      - node
      - opencode
  triggers:
    - opencode
    - ai coding
    - code generation
    - session management
    - agent teams
    - skill
    - hook
    - task dispatch
---

# OpenCode MCP Adapter Skill

Use this skill when you need to leverage **OpenCode AI coding** capabilities through the MCP protocol.

## When to Use

- **AI Coding**: code generation, debugging, refactoring, code explanation
- **Session Management**: list/continue/export/fork coding sessions
- **Agent Orchestration**: multi-agent collaboration via oh-my-opencode (Sisyphus/Prometheus/SubAgent)
- **Skill System**: activate superpower skills (playwright, git-master, etc.)
- **Task Callback**: dispatch OpenCode tasks with auto-result collection and wake notifications

## MCP Server Setup

Configure in your MCP client settings:

```json
{
  "mcpServers": {
    "opencode-adapter": {
      "type": "stdio",
      "command": "node",
      "args": ["<path-to>/opencode-mcp-server/dist/index.js"],
      "env": {
        "OPENCODE_TIMEOUT_MS": "120000",
        "OPENCODE_WORKSPACE": "<your-project-dir>",
        "HOOK_RESULT_DIR": "<path-to>/open-code-results"
      }
    }
  }
}
```

## Available Tools (21)

### Core (3)

| Tool | Usage |
|------|-------|
| `opencode_run` | Execute an AI coding prompt. Use for code generation, debugging, refactoring. |
| `opencode_models` | List available LLM models before selecting one. |
| `opencode_auth` | Verify authentication status before running tasks. |

### Session Management (4)

| Tool | Usage |
|------|-------|
| `opencode_session_list` | List all sessions to find previous work. |
| `opencode_session_continue` | Resume a previous session by ID. |
| `opencode_session_export` | Export session history for review or archival. |
| `opencode_session_fork` | Branch a session to try alternative approaches. |

### Agent Orchestration (3)

| Tool | Usage |
|------|-------|
| `opencode_agent_list` | Discover available agents. |
| `opencode_agent_create` | Create specialized agents for specific tasks. |
| `opencode_agent_run` | Run a prompt with a specific agent. |

### Custom Commands (1)

| Tool | Usage |
|------|-------|
| `opencode_command_run` | Execute a slash command (e.g., `/speckit`). |

### Serve Mode (2)

| Tool | Usage |
|------|-------|
| `opencode_serve_start` | Start an HTTP/Web server for headless access. |
| `opencode_serve_status` | Check if the server is running. |

### Multi-Agent — oh-my-opencode (3)

| Tool | Usage |
|------|-------|
| `opencode_sisyphus` | Complex tasks: Sisyphus plans, delegates, executes, and verifies. |
| `opencode_prometheus` | Analysis & planning: Prometheus asks clarifying questions and generates work plans. |
| `opencode_subagent` | Parallel execution: dispatch sub-tasks to independent agents. |

### Superpower Skills (2)

| Tool | Usage |
|------|-------|
| `opencode_skill_list` | Discover available skills (e.g., playwright, git-master). |
| `opencode_skill_use` | Activate a skill and execute a task with its knowledge context. |

### Stop Hook — Task Callback (3)

| Tool | Usage |
|------|-------|
| `opencode_hook_dispatch` | Dispatch a task with auto-result collection. Writes `task-meta.json`, runs OpenCode, writes `latest.json` and `pending-wake.json`. |
| `opencode_hook_result` | Read the latest task result from `latest.json`. |
| `opencode_hook_wake` | Read `pending-wake.json` for AGI integration; optionally mark as processed. |

## Workflow Examples

### 1. Simple AI Coding

```text
1. Call opencode_run with your prompt
2. Review the output
```

### 2. Complex Multi-Step Task (Sisyphus)

```text
1. Call opencode_sisyphus with a high-level goal
2. Sisyphus automatically plans → delegates → executes → verifies
3. Review the final output
```

### 3. Task Dispatch with Callback

```text
1. Call opencode_hook_dispatch with prompt, task_name, and optional group
2. OpenCode executes the task
3. Results are written to latest.json automatically
4. Call opencode_hook_result to read the result
5. Call opencode_hook_wake to check AGI wake status
```

### 4. Skill-Enhanced Coding

```text
1. Call opencode_skill_list to discover available skills
2. Call opencode_skill_use with skill name and task prompt
3. The agent uses the skill's knowledge context to produce better results
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENCODE_PATH` | `opencode` | OpenCode CLI path |
| `OPENCODE_TIMEOUT_MS` | `120000` | Timeout in ms |
| `OPENCODE_WORKSPACE` | `.` | Default working directory |
| `OPENCODE_MODEL` | (empty) | Default LLM model |
| `OPENCODE_MAX_OUTPUT` | `10485760` | Max output bytes |
| `HOOK_RESULT_DIR` | `~/opencode-data/hook-results` | Hook result directory |
