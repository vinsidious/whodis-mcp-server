import { Command } from 'commander';
import { Logger } from '../utils/logger.util.js';
import { handleCliError } from '../utils/error.util.js';
import domainAvailabilityController from '../controllers/domain-availability.controller.js';

/**
 * Register Domain Availability CLI commands
 * @param program The Commander program instance
 */
function register(program: Command) {
	const cliLogger = Logger.forContext(
		'cli/domain-availability.cli.ts',
		'register',
	);
	cliLogger.debug(`Registering domain availability CLI commands...`);

	program
		.command('check-domain-availability')
		.description(
			'Check the availability of one or more domain names using WHOIS lookups.',
		)
		.argument('<domains...>', 'One or more domain names to check')
		.action(async (domains: string[]) => {
			const commandLogger = Logger.forContext(
				'cli/domain-availability.cli.ts',
				'check-domain-availability',
			);
			try {
				commandLogger.debug(`CLI check-domain-availability called`, {
					domains,
				});

				if (!domains || domains.length === 0) {
					commandLogger.error('No domain names provided.');
					console.error('Error: Please provide at least one domain name.');
					process.exit(1);
				}

				const result = await domainAvailabilityController.check(domains);

				commandLogger.debug(`Domain availability check completed.`);
				// Output the JSON result directly to the console
				console.log(result.content);
			} catch (error) {
				// Use the standard CLI error handler
				handleCliError(error);
			}
		});

	cliLogger.debug('Domain availability CLI commands registered successfully');
}

export default { register };