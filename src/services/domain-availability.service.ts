import * as whoiser from 'whoiser'; // Use whoiser v1 as per docs provided
import { Logger } from '../utils/logger.util.js'
import { DomainAvailabilityResult } from '../tools/domain-availability.types.js'
import {
    ensureMcpError
} from '../utils/error.util.js'

const serviceLogger = Logger.forContext(
	'services/domain-availability.service.ts',
);

/**
 * @namespace DomainAvailabilityService
 * @description Service layer for checking domain availability using the whoiser library.
 */

/**
 * Checks the availability of a list of domain names.
 *
 * @function check
 * @memberof DomainAvailabilityService
 * @param {string[]} domains - An array of domain names to check.
 * @returns {Promise<DomainAvailabilityResult>} A promise that resolves to an object containing arrays of available and unavailable domains.
 * @throws {McpError} Throws an McpError if a fundamental issue occurs (e.g., library issue), but individual domain lookup errors are handled internally.
 */
async function check(domains: string[]): Promise<DomainAvailabilityResult> {
	const methodLogger = serviceLogger.forMethod('check');
	methodLogger.debug(`Checking availability for ${domains.length} domains`, {
		domains,
	});

	const results: DomainAvailabilityResult = {
		available: [],
		unavailable: [],
	};

	// Use Promise.allSettled to handle potential errors for individual domains
	const checks = await Promise.allSettled(
		domains.map(async (domain) => {
			const domainLogger = methodLogger.forMethod(`check:${domain}`);
			try {
				// Use whoiser.domain for potentially better parsing/handling
				// Using default follow: 2 (Registry + Registrar) for better availability check
				const domainInfo = await whoiser.domain(domain, { timeout: 5000 }); // 5s timeout

				// Determine availability:
				// If the lookup succeeds and returns *any* data object, assume it's registered (unavailable).
				// The structure might vary, but non-empty object implies registration data was found.
				if (
					domainInfo &&
					typeof domainInfo === 'object' &&
					Object.keys(domainInfo).length > 0
				) {
					// Check for specific registrar data keys as a stronger indicator
					const hasRegistrarData = Object.values(domainInfo).some(
						(serverData: any) =>
							serverData &&
							(serverData['Registrar'] ||
								serverData['Creation Date'] ||
								serverData['Expiry Date']),
					);

					if (hasRegistrarData) {
						domainLogger.debug(
							`Domain [${domain}] is UNAVAILABLE (found registrar data)`,
						);
						return { domain, status: 'unavailable' };
					} else {
						// If no clear registrar data, but *some* response, it *might* be available but could also be an edge case.
						// Let's lean towards available if no strong registration signs. Check for "No match" patterns.
						const rawText = JSON.stringify(domainInfo).toLowerCase();
						if (
							rawText.includes('no match') ||
							rawText.includes('not found') ||
							rawText.includes('domain name not known') ||
							rawText.includes('no entries found') ||
                            rawText.includes('is available') ||
							rawText.includes('is free')
						) {
							domainLogger.debug(
								`Domain [${domain}] is AVAILABLE (explicit 'no match' found in response)`,
							);
							return { domain, status: 'available' };
						} else {
                            // If some data returned but no clear registration or "no match", treat as unavailable (safer default)
						    domainLogger.warn(
							    `Domain [${domain}] is treated as UNAVAILABLE (ambiguous response, no clear 'no match' or registrar data)`, domainInfo
						    );
						    return { domain, status: 'unavailable' };
                        }
					}
				} else {
					// Empty object response often indicates availability
					domainLogger.debug(
						`Domain [${domain}] is AVAILABLE (empty response object)`,
					);
					return { domain, status: 'available' };
				}
			} catch (error: any) {
				// Handle errors: If specific "not found" errors occur, consider it available.
				const errorMessage = (
					error.message ||
					String(error)
				).toLowerCase();
				if (
					errorMessage.includes('no match') ||
					errorMessage.includes('not found') ||
					errorMessage.includes('domain name not known') ||
                    errorMessage.includes('no entries found')
				) {
					domainLogger.debug(
						`Domain [${domain}] is AVAILABLE (error indicates 'not found')`,
						errorMessage,
					);
					return { domain, status: 'available' };
				} else {
					// Other errors (timeouts, network issues, unexpected format) are logged but don't confirm availability.
					// We won't classify these definitively. Consider them *potentially* unavailable or lookup failed.
					// For simplicity in this tool, we might log and skip, or treat as unavailable. Let's log and skip.
					domainLogger.error(
						`Failed to lookup domain [${domain}]. Skipping classification.`,
						error,
					);
					// Returning null signifies a failed lookup for this domain
					return { domain, status: 'failed', error: ensureMcpError(error) };
				}
			}
		}),
	);

	// Process the results from Promise.allSettled
	checks.forEach((result, index) => {
		const domain = domains[index];
		if (result.status === 'fulfilled' && result.value) {
            const {status} = result.value;
			if (status === 'available') {
				results.available.push(domain);
			} else if (status === 'unavailable') {
				results.unavailable.push(domain);
			}
            // 'failed' status is already logged above, so we just skip adding it to lists.
		} else if (result.status === 'rejected') {
			// This should ideally not happen if the inner try/catch is robust, but log it just in case.
			methodLogger.error(
				`Unexpected rejection for domain [${domain}] lookup`,
				result.reason,
			);
		}
	});

	methodLogger.debug('Finished checking domains', results);
	return results;
}

export default { check };