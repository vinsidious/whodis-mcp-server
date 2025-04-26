import fs from 'fs';
import path from 'path';
import { Logger } from './logger.util.js';
import dotenv from 'dotenv';
import os from 'os';
import { PACKAGE_NAME } from './constants.util.js'; // Import the constant

/**
 * Configuration loader that handles multiple sources with priority:
 * 1. Direct ENV pass (process.env)
 * 2. .env file in project root
 * 3. Global config file at $HOME/.mcp/configs.json
 */
class ConfigLoader {
	private packageName: string;
	private configLoaded: boolean = false;

	/**
	 * Create a new ConfigLoader instance
	 * @param packageName The package name to use for global config lookup
	 */
	constructor(packageName: string) {
		this.packageName = packageName;
	}

	/**
	 * Load configuration from all sources with proper priority
	 */
	load(): void {
		const methodLogger = Logger.forContext('utils/config.util.ts', 'load');

		if (this.configLoaded) {
			methodLogger.debug('Configuration already loaded, skipping');
			return;
		}

		methodLogger.debug('Loading configuration...');

		// Priority 3: Load from global config file
		this.loadFromGlobalConfig();

		// Priority 2: Load from .env file
		this.loadFromEnvFile();

		// Priority 1: Direct ENV pass is already in process.env
		// No need to do anything as it already has highest priority

		this.configLoaded = true;
		methodLogger.debug('Configuration loaded successfully');
	}

	/**
	 * Load configuration from .env file in project root
	 */
	private loadFromEnvFile(): void {
		const methodLogger = Logger.forContext(
			'utils/config.util.ts',
			'loadFromEnvFile',
		);

		try {
			// Use dotenv.config({ path: path.resolve(process.cwd(), '.env') }) for robustness
			const result = dotenv.config({
				path: path.resolve(process.cwd(), '.env'),
			});
			if (result.error) {
				// It's okay if .env doesn't exist
				if ((result.error as any).code !== 'ENOENT') {
					methodLogger.warn(
						`Error reading .env file: ${result.error.message}`,
					);
				} else {
					methodLogger.debug('No .env file found.');
				}
				return;
			}
			if (result.parsed && Object.keys(result.parsed).length > 0) {
				methodLogger.debug('Loaded configuration from .env file');
			} else {
				methodLogger.debug(
					'.env file found but is empty or only contains comments.',
				);
			}
		} catch (error) {
			methodLogger.error('Error processing .env file', error);
		}
	}

	/**
	 * Load configuration from global config file at $HOME/.mcp/configs.json
	 */
	private loadFromGlobalConfig(): void {
		const methodLogger = Logger.forContext(
			'utils/config.util.ts',
			'loadFromGlobalConfig',
		);

		try {
			const homedir = os.homedir();
			const globalConfigPath = path.join(homedir, '.mcp', 'configs.json');

			if (!fs.existsSync(globalConfigPath)) {
				methodLogger.debug('Global config file not found');
				return;
			}

			const configContent = fs.readFileSync(globalConfigPath, 'utf8');
			const config = JSON.parse(configContent);

			if (
				!config[this.packageName] ||
				!config[this.packageName].environments
			) {
				methodLogger.debug(
					`No configuration found for ${this.packageName} in global config`,
				);
				return;
			}

			const environments = config[this.packageName].environments;
			let loadedCount = 0;
			for (const [key, value] of Object.entries(environments)) {
				// Only set if not already defined in process.env (respecting higher priority)
				if (process.env[key] === undefined) {
					process.env[key] = String(value);
					loadedCount++;
				}
			}

			if (loadedCount > 0) {
				methodLogger.debug(
					`Loaded ${loadedCount} variable(s) from global config file for ${this.packageName}`,
				);
			} else {
				methodLogger.debug(
					`Global config found for ${this.packageName}, but all variables were already set by higher priority sources.`,
				);
			}
		} catch (error) {
			methodLogger.error('Error loading global config file', error);
		}
	}

	/**
	 * Get a configuration value
	 * @param key The configuration key
	 * @param defaultValue The default value if the key is not found
	 * @returns The configuration value or the default value
	 */
	get(key: string, defaultValue?: string): string | undefined {
		return process.env[key] ?? defaultValue;
	}

	/**
	 * Get a boolean configuration value
	 * @param key The configuration key
	 * @param defaultValue The default value if the key is not found
	 * @returns The boolean configuration value or the default value
	 */
	getBoolean(key: string, defaultValue: boolean = false): boolean {
		const value = this.get(key);
		if (value === undefined || value === null) {
			return defaultValue;
		}
		// Explicitly check for 'false', '0', empty string as false, otherwise treat as true
		const lowerValue = value.trim().toLowerCase();
		if (lowerValue === 'false' || lowerValue === '0' || lowerValue === '') {
			return false;
		}
		// Any other non-empty value is considered true
		return true;
	}
}

// Create and export a singleton instance using the package name constant
export const config = new ConfigLoader(PACKAGE_NAME);
