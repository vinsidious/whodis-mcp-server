import domainAvailabilityService from '../services/domain-availability.service.js';
import { Logger } from '../utils/logger.util.js';
import { ControllerResponse } from '../types/common.types.js';
import { handleControllerError } from '../utils/error-handler.util.js';
import { DomainAvailabilityResult } from '../tools/domain-availability.types.js';

const controllerLogger = Logger.forContext(
	'controllers/domain-availability.controller.ts',
);

/**
 * @namespace DomainAvailabilityController
 * @description Controller for handling domain availability checks.
 */

/**
 * Checks domain availability and returns a formatted response.
 *
 * @function check
 * @memberof DomainAvailabilityController
 * @param {string[]} domains - An array of domain names.
 * @returns {Promise<ControllerResponse>} A promise resolving to the standard controller response containing the availability results as JSON.
 * @throws {McpError} Propagates errors from the service layer, handled by `handleControllerError`.
 */
async function check(domains: string[]): Promise<ControllerResponse> {
	const methodLogger = controllerLogger.forMethod('check');
	methodLogger.debug(`Checking availability for ${domains.length} domains.`);

	try {
		const availabilityResult: DomainAvailabilityResult =
			await domainAvailabilityService.check(domains);

		// Format the result as a JSON string for the response content
		const formattedContent = JSON.stringify(availabilityResult, null, 2);

		methodLogger.debug('Domain availability check successful.');
		return {
			content: formattedContent,
			// No pagination needed for this operation
		};
	} catch (error) {
		// Use the standardized error handler
		// `handleControllerError` throws the error, so we don't need to return here in the catch block.
        // However, the function signature requires a return type, so TS might complain.
        // Let's explicitly return the result of handleControllerError which throws.
		return handleControllerError(error, {
			entityType: 'Domain Availability',
			operation: 'checking',
			source: 'controllers/domain-availability.controller.ts@check',
			additionalInfo: { domainCount: domains.length },
		});
	}
}

export default { check };