# Whodis MCP Server

This project provides a Model Context Protocol (MCP) server specifically designed to check the availability of domain names using WHOIS lookups. It allows AI assistants or other tools to integrate domain availability checks into their workflows.

---

# Overview

## What is MCP?

Model Context Protocol (MCP) is an open standard that allows AI systems to securely and contextually connect with external tools and data sources. This server implements the MCP standard to provide domain availability information.

## Features

-   **Domain Availability Checks**: Uses the `whoiser` library to perform WHOIS lookups and determine if domains appear to be available or registered.
-   **MCP Tool Integration**: Exposes a `check-domain-availability` tool for MCP clients (like AI assistants).
-   **CLI Interface**: Includes a command-line interface (`whodis-mcp-server check-domain-availability ...`) for direct usage and testing.
-   **Structured Logging**: Provides detailed logging for debugging and monitoring.
-   **Configurable**: Supports configuration via environment variables or `.env` files.

---

# Getting Started

## Prerequisites

-   **Node.js** (>=18.x): [Download](https://nodejs.org/)
-   **Git**: For version control

---

## Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/vinsidious/whodis-mcp-server.git
cd whodis-mcp-server

# Install dependencies
npm install
```

---

## Step 2: Run Development Server

Start the server in development mode to interact with it via the MCP Inspector:

```bash
npm run dev:server
```

This starts the MCP server and enables the MCP Inspector at http://localhost:5173, where you can test the `check-domain-availability` tool.

---

## Step 3: Test the Tool via CLI

Run the domain availability checker directly from the command line:

```bash
# Using CLI in development mode
npm run dev:cli -- check-domain-availability example.com non-existent-domain-12345.org

# Or run the built version
npm run start:cli -- check-domain-availability google.com my-unique-idea.dev
```

The CLI will output a JSON object containing `available` and `unavailable` arrays.

---

# Architecture

This server follows a layered architecture:

```
src/
├── cli/              # Command-line interface logic
├── controllers/      # Business logic for domain checks
├── services/         # Interaction with the whoiser library
├── tools/            # MCP tool definition and argument validation
├── types/            # Shared type definitions
├── utils/            # Shared utilities (logging, errors, etc.)
└── index.ts          # Main entry point for server and CLI
```

---

# Development Guide

## Development Scripts

```bash
# Start MCP server in development mode (with MCP Inspector)
npm run dev:server

# Run CLI commands in development mode
npm run dev:cli -- check-domain-availability <domains...>

# Build the project for production
npm run build

# Start MCP server in production mode (requires MCP client)
npm run start:server

# Run CLI commands using the production build
npm run start:cli -- check-domain-availability <domains...>
```

## Testing

```bash
# Run all tests
npm test

# Generate test coverage report
npm run test:coverage
```

## Code Quality

```bash
# Lint code
npm run lint

# Format code with Prettier
npm run format
```

---

# MCP Tool: `check-domain-availability`

-   **PURPOSE**: Checks the availability of one or more domain names.
-   **INPUT**: An array of domain names.
	```json
	{
		"domains": ["example.com", "another-domain.net"]
	}
	```
-   **OUTPUT**: A JSON object containing two arrays: `available` (domains that appear to be unregistered) and `unavailable` (domains that appear to be registered).
	```json
	{
		"available": ["likely-available-domain123.xyz"],
		"unavailable": ["google.com"]
	}
	```
	*Note*: Availability checks depend on WHOIS server responses and might not be 100% accurate for all TLDs or due to temporary network issues. Domains where lookup failed are omitted.
-   **WHEN TO USE**: Use this tool when you need to determine if specific domain names can potentially be registered.

---

# Debugging

## MCP Inspector

Access the visual MCP Inspector to test the tool and view request/response details:

1.  Run `npm run dev:server`
2.  Open http://localhost:5173 in your browser
3.  Use the UI to call the `check-domain-availability` tool.

## Server Logs

Enable debug logs for detailed output:

```bash
# Set environment variable
DEBUG=true npm run dev:server

# Or set DEBUG=true in your .env file
```

Logs are also saved to files in `~/.mcp/data/whodis-mcp-server.*.log`.

---

# Publishing

To publish updates to npm:

1.  Ensure changes are committed and follow conventional commit messages (e.g., `feat:`, `fix:`, `chore:`).
2.  Push changes to the `main` branch.
3.  The `ci-semantic-release.yml` workflow will automatically build, test, version, and publish the package to npm.

---

# License

[ISC License](https://opensource.org/licenses/ISC)