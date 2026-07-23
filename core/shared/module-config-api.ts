import fs from 'fs';

interface ModuleConfigApi {
  requireString: (key: string) => string;
  requireExistingPath: (key: string) => string;
  requireInteger: (key: string, min?: number) => number;
  optionalPositiveNumber: (key: string) => number | undefined;
}

/**
 * Creates a small validation API for module-specific config keys.
 * Modules can use this in validate(config) to keep checks concise and consistent.
 */
export const createModuleConfigApi = (
  moduleName: string,
  config: Record<string, unknown>,
): ModuleConfigApi => {
  const prefix = `[${moduleName}]`;

  const requireString = (key: string): string => {
    const value = config[key];
    if (typeof value !== 'string' || !value.trim()) {
      throw new Error(`${prefix} missing or invalid config key: ${key}`);
    }
    return value;
  };

  const requireExistingPath = (key: string): string => {
    const value = requireString(key);
    if (!fs.existsSync(value)) {
      throw new Error(`${prefix} config path does not exist: ${key} -> ${value}`);
    }
    return value;
  };

  const requireInteger = (key: string, min = Number.MIN_SAFE_INTEGER): number => {
    const value = config[key];
    if (!Number.isInteger(value)) {
      throw new Error(`${prefix} missing or invalid integer config key: ${key}`);
    }
    const intValue = value as number;
    if (intValue < min) {
      throw new Error(`${prefix} config key must be >= ${min}: ${key} -> ${intValue}`);
    }
    return intValue;
  };

  const optionalPositiveNumber = (key: string): number | undefined => {
    const value = config[key];
    if (value === undefined) {
      return undefined;
    }
    if (typeof value !== 'number' || value < 1) {
      throw new Error(`${prefix} optional config key must be a positive number: ${key}`);
    }
    return value;
  };

  return {
    requireString,
    requireExistingPath,
    requireInteger,
    optionalPositiveNumber,
  };
};
