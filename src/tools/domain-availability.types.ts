import { z } from 'zod'

// Schema for the arguments expected by the tool
export const CheckDomainAvailabilityArgs = z.object({
	domains: z
		.array(z.string().min(1, 'Domain name cannot be empty'))
		.min(1, 'At least one domain name is required')
		.describe('An array of domain names to check for availability'),
});

// Infer the TypeScript type from the Zod schema
export type CheckDomainAvailabilityArgsType = z.infer<
	typeof CheckDomainAvailabilityArgs
>;

// Define the structure of the result object returned by the controller/service
export interface DomainAvailabilityResult {
	available: string[];
	unavailable: string[];
}