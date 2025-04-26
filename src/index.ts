#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Logger } from './utils/logger.util.js';
import { config } from './utils/config.util.js';
import { createUnexpectedError, handleCliError } from './utils/error.util.js'; // Import handleCliError
import { VERSION, PACKAGE_NAME } from './utils/constants.util.js';
import { runCli } from './cli/index.js';

// Import tools
import domainAvailabilityTool from './tools/domain-availability.tool.js';

// Create file-level logger
const indexLogger = Logger.forContext('index.ts');

// Log initialization at debug level
indexLogger.debug('Whodis MCP server module loaded');

let serverInstance: McpServer | null = null;
let transportInstance: SSEServerTransport | StdioServerTransport | null = null;

/**
 * Start the MCP server with the specified transport mode
 *
 * @param mode The transport mode to use (stdio or sse)
 * @returns Promise that resolves to the server instance when started successfully
 */
export async function startServer(mode: 'stdio' | 'sse' = 'stdio') {
	const serverLogger = Logger.forContext('index.ts', 'startServer');

	// Load configuration
	serverLogger.info('Starting Whodis MCP server initialization...');
	config.load();
	serverLogger.info('Configuration loaded successfully');

	// Enable debug logging if DEBUG is set
	if (config.getBoolean('DEBUG')) {
		serverLogger.debug('Debug mode enabled via config');
	} else {
		serverLogger.debug('Debug mode is disabled');
	}
	serverLogger.debug(`Resolved DEBUG config value: ${config.get('DEBUG')}`);

	serverLogger.info(`Initializing Whodis MCP Server v${VERSION}`);
	serverInstance = new McpServer({
		name: PACKAGE_NAME,
		version: VERSION,
	});

	if (mode === 'stdio') {
		serverLogger.info('Using STDIO transport for MCP communication');
		transportInstance = new StdioServerTransport();
	} else {
		// Keep this check in case SSE is supported later
		serverLogger.error('SSE mode is not currently supported');
		throw createUnexpectedError('SSE mode is not supported yet');
	}

	// Register tools
	serverLogger.info('Registering MCP tools...');

	domainAvailabilityTool.registerTools(serverInstance);
	serverLogger.debug('Registered Domain Availability tool');

	serverLogger.info('All tools registered successfully');

	try {
		serverLogger.info(`Connecting to ${mode.toUpperCase()} transport...`);
		await serverInstance.connect(transportInstance);
		serverLogger.info(
			'Whodis MCP server started successfully and ready to process requests',
		);
		return serverInstance;
	} catch (err) {
		serverLogger.error(`Failed to start MCP server`, err);
		// Ensure graceful exit
		process.exit(1);
	}
}

/**
 * Main entry point - determines whether to run in CLI or server mode.
 */
async function main() {
	const mainLogger = Logger.forContext('index.ts', 'main');

	try {
		// Load configuration early
		config.load();
		mainLogger.debug(
			`Initial DEBUG environment variable: ${process.env.DEBUG}`,
		);
		mainLogger.debug(`Initial Config DEBUG value: ${config.get('DEBUG')}`);
		mainLogger.debug(
			`Resolved DEBUG boolean: ${config.getBoolean('DEBUG')}`,
		);

		// Check if arguments indicate CLI mode (more than just 'node' and 'script.js')
		if (process.argv.length > 2) {
			mainLogger.info('Starting in CLI mode');
			// Pass all arguments after the script name to the CLI runner
			await runCli(process.argv); // Pass the full argv array
			mainLogger.info('CLI execution completed');
		} else {
			// MCP Server mode: Start server with default STDIO
			mainLogger.info(
				'No CLI arguments provided. Starting in MCP server mode (stdio)',
			);
			await startServer('stdio'); // Explicitly specify stdio
			mainLogger.info(
				'Server is now running and listening for MCP requests',
			);
			// Keep the process alive in server mode
			// This typically happens implicitly if the transport keeps the event loop busy.
			// For stdio, it waits for input. Add a mechanism if needed.
			// Example: new Promise(() => {}); // Keep alive indefinitely
		}
	} catch (error) {
		// Use the CLI error handler for consistency, even if it's a server startup error
		handleCliError(error);
	}
}

// Execute main only if the script is run directly
// Using check `require.main === module` is commonjs style.
// For ESM compatibility, a different check might be needed if this was pure ESM.
// Since package.json specifies "type": "commonjs", this check is correct.
if (require.main === module) {
	main().catch((err) => {
		// This catch is a fallback, main() should handle errors internally
		indexLogger.error('Unhandled error in main execution:', err);
		process.exit(1); // Ensure exit on unhandled error
	});
}

// Export key elements for potential programmatic use (though primarily a server/CLI tool)
export { config };
export { Logger };
export { VERSION, PACKAGE_NAME } from './utils/constants.util.js';
