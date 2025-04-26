import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js'
import { Logger } from '../utils/logger.util.js'
import { formatErrorForMcpTool } from '../utils/error.util.js'
import domainAvailabilityController from '../controllers/domain-availability.controller.js'
import {
    CheckDomainAvailabilityArgs,
    CheckDomainAvailabilityArgsType
} from './domain-availability.types.js'

const toolLogger = Logger.forContext('tools/domain-availability.tool.ts');

/**
 * MCP Tool handler function for checking domain availability.
 *
 * @param {CheckDomainAvailabilityArgsType} args - Arguments containing the list of domains.
 * @param {RequestHandlerExtra} _extra - Additional request context (unused).
 * @returns {Promise<{ content: Array<{ type: 'text', text: string }> }>} MCP tool response containing the availability results as JSON.
 */
async function handleCheckDomainAvailability(
	args: CheckDomainAvailabilityArgsType,
	_extra: RequestHandlerExtra<any, any>,
) {
	const methodLogger = toolLogger.forMethod('handleCheckDomainAvailability');
	methodLogger.debug('Tool check-domain-availability called', args);

	try {
		// Call the controller to perform the check
		const result = await domainAvailabilityController.check(args.domains);

		// The controller already formats the content as a JSON string
		methodLogger.debug('Successfully retrieved domain availability info.');
		return {
			content: [
				{
					type: 'text' as const,
					text: result.content, // Content is the JSON string from the controller
				},
			],
		};
	} catch (error) {
		methodLogger.error('Tool check-domain-availability failed', error);
		// Use the standard error formatter for MCP tools
		return formatErrorForMcpTool(error);
	}
}

/**
 * Registers the domain availability tool with the MCP server.
 *
 * @param {McpServer} server - The MCP server instance.
 */
function registerTools(server: McpServer) {
	const methodLogger = toolLogger.forMethod('registerTools');
	methodLogger.debug('Registering check-domain-availability tool...');

	server.tool(
		'check-domain-availability',
		`PURPOSE: Checks the availability of one or more domain names.
        INPUT: An array of domain names.
        OUTPUT: A JSON object containing two arrays: 'available' (domains that appear to be unregistered) and 'unavailable' (domains that appear to be registered). Note: Availability checks depend on WHOIS server responses and might not be 100% accurate for all TLDs or due to temporary network issues. Domains where lookup failed are omitted.
        WHEN TO USE: Use this tool when you need to determine if specific domain names can potentially be registered.
        EXAMPLE: { "domains": ["google.com", "example-domain-that-is-likely-free-12345.com"] }`,
		CheckDomainAvailabilityArgs.shape, // Use the Zod schema shape for validation
		handleCheckDomainAvailability,
	);

	methodLogger.debug('Successfully registered check-domain-availability tool.');
}

export default { registerTools };