import { Command } from 'commander';
import { Logger } from '../utils/logger.util.js';
import { VERSION, CLI_NAME } from '../utils/constants.util.js';

import domainAvailabilityCli from './domain-availability.cli.js';

/**
	* CLI entry point for the Whodis MCP Server
	* Handles command registration, parsing, and execution for domain availability checks.
 */

// Package description
const DESCRIPTION =
	'Whodis MCP Server CLI - Utilities for checking domain name availability.';

/**
 * Run the CLI with the provided arguments
 *
 * @param args Command line arguments to process
 * @returns Promise that resolves when CLI command execution completes
 */
export async function runCli(args: string[]) {
	const cliLogger = Logger.forContext('cli/index.ts', 'runCli');
	cliLogger.debug('Initializing CLI with arguments', args);

	const program = new Command();

	program.name(CLI_NAME).description(DESCRIPTION).version(VERSION);

	// Register CLI commands
	cliLogger.debug('Registering CLI commands...');
	domainAvailabilityCli.register(program);
	cliLogger.debug('CLI commands registered successfully');

	// Handle unknown commands
	program.on('command:*', (operands) => {
		cliLogger.error(`Unknown command: ${operands[0]}`);
		console.error(
			`\nError: Unknown command '${operands[0]}'. See --help for available commands.\n`,
		);
		program.outputHelp(); // Show help automatically
		process.exit(1);
	});

	// Parse arguments; default to help if no command provided
	cliLogger.debug('Parsing CLI arguments');
	// Ensure '--help' is added if no arguments or only the script name is present
	const argsToParse = args.length > 2 ? args : [...args, '--help'];
	await program.parseAsync(argsToParse, { from: 'user' });
	cliLogger.debug('CLI command execution completed');
}