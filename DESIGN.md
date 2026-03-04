# OpenCode MCP Server — Design Document

> **Author**: shichao.han | **Version**: 1.1.0 | **Date**: 2026/03/04 14:14

## 1. Overview

OpenCode MCP Server is an **adapter layer** that exposes the full capabilities of the [OpenCode CLI](https://opencode.ai/) as standardized MCP (Model Context Protocol) tool services. It enables any MCP-compatible client (e.g. OpenClaw) to leverage AI-powered coding assistance, session management, multi-agent orchestration, and skill invocations — all through a unified protocol over stdio.

## 2. Architecture

```text
┌──────────────────────┐
│   MCP Client         │  (e.g. OpenClaw, Claude Desktop)
│   (JSON-RPC / stdio) │
└──────────┬───────────┘
           │ MCP Protocol
           ▼
┌──────────────────────┐
│  opencode-mcp-server │
│  ┌────────────────┐  │
│  │  Tool Registry │◄─┼── Registers all 21 tools at startup
│  └───────┬────────┘  │
│          │ dispatch   │
│  ┌───────▼────────┐  │
│  │  Tool Handler  │  │  Strategy Pattern: each tool implements ToolDefinition
│  └───────┬────────┘  │
│          │ execute    │
│  ┌───────▼────────┐  │
│  │   Executor     │  │  Adapter Pattern: translates MCP calls → CLI subprocesses
│  └───────┬────────┘  │
│          │ spawn      │
│  ┌───────▼────────┐  │
│  │   Config       │  │  Centralized env / timeout / path configuration
│  └────────────────┘  │
└──────────────────────┘
           │ subprocess
           ▼
┌──────────────────────┐
│    opencode CLI      │  → LLM Provider
└──────────────────────┘
```

## 3. Design Patterns

### 3.1 Adapter Pattern (`executor.ts`)

The `Executor` class adapts MCP tool calls into OpenCode CLI subprocess invocations. It handles:

- **Command construction**: builds CLI argument arrays from structured tool parameters.
- **Process lifecycle**: spawns, monitors, and collects stdout/stderr.
- **Timeout management**: enforces configurable timeouts via `OPENCODE_TIMEOUT_MS`.
- **Output truncation**: limits output size via `OPENCODE_MAX_OUTPUT`.

### 3.2 Registry Pattern (`tool-registry.ts`)

The `ToolRegistry` provides a centralized catalog of all available MCP tools:

- Tools self-register at import time via `registerTool()`.
- The MCP server queries the registry to respond to `tools/list` requests.
- New tools can be added by simply creating a new file and importing it — **no changes to existing code** (Open/Closed Principle).

### 3.3 Strategy Pattern (`tool-definition.ts` + `tools/*`)

Each tool implements a common `ToolDefinition` interface:

```typescript
interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: ZodSchema;
  handler(args: unknown): Promise<ToolResult>;
}
```

The server dispatches incoming `tools/call` requests to the matching handler, decoupling routing from business logic.

### 3.4 Open/Closed Principle

Adding a new tool requires **only**:

1. Create a new `.ts` file in `src/tools/`.
2. Define the tool using `ToolDefinition`.
3. Import the file in `src/tools/index.ts`.

No modification of the server core, registry infrastructure, or executor is needed.

## 4. Module Responsibilities

| Module | File | Responsibility |
|--------|------|----------------|
| **Entry** | `index.ts` | Bootstrap MCP server, register tools, start stdio transport |
| **Config** | `config.ts` | Read environment variables, supply defaults |
| **Executor** | `executor.ts` | Spawn CLI subprocess, collect & truncate output |
| **Tool Definition** | `tool-definition.ts` | TypeScript interface / Zod schema for tool contracts |
| **Tool Registry** | `tool-registry.ts` | In-memory map of `name → ToolDefinition` |
| **Core Tools** | `tools/opencode-run.ts` etc. | Implement individual tool handlers |
| **Multi-Agent** | `tools/opencode-omoc.ts` | oh-my-opencode Sisyphus / Prometheus / SubAgent |
| **Skills** | `tools/opencode-skills.ts` | superpower skill listing & activation |
| **Stop Hook** | `tools/opencode-hooks.ts` | Task dispatch, result reading, wake file processing |

## 5. Multi-Language (i18n) Considerations

- Tool names and identifiers use language-neutral IDs (`opencode_run`, `opencode_models`).
- User-facing descriptions are kept in English as the MCP protocol standard.
- Documentation ships in both **Chinese** (`README.md`) and **English** (`README_EN.md`).

## 6. High Availability & Performance

| Concern | Implementation |
|---------|---------------|
| **Timeout** | Configurable per-request via `OPENCODE_TIMEOUT_MS` |
| **Process isolation** | Each tool call spawns an independent subprocess |
| **Output safety** | `OPENCODE_MAX_OUTPUT` prevents memory exhaustion |
| **Stateless adapter** | Server holds no mutable state → horizontally scalable |

## 7. Technology Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js >= 18 |
| Language | TypeScript 5.6+ |
| MCP SDK | `@modelcontextprotocol/sdk` ^1.26.0 |
| Validation | `zod` ^3.23.0 |
| Testing | `vitest` ^2.1.0 |
| Build | `tsc` (TypeScript Compiler) |

## 8. Project Directory Structure

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
├── dist/                           # Compiled output
├── package.json
├── tsconfig.json
├── README.md                       # 中文文档
├── README_EN.md                    # English documentation
└── DESIGN.md                       # This document
```

---

**Author**: shichao.han | **Version**: 1.1.0 | **License**: MIT
