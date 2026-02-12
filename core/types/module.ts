import type { Config } from './config.js';
import type { LayoutDirectoryPair } from './layout.js';

/**
 * Context passed to module functions.
 * @property config - The merged SSG configuration.
 * @property layoutData - Extra layout placeholder values (optional).
 */
export interface ModuleContext {
  config: Config;
  layoutData?: Record<string, string>;
}

/**
 * Shape of a module that extends the generator.
 */
export interface Module {
  name?: string;
  directoryPairs?: LayoutDirectoryPair[] | ((config: Config) => LayoutDirectoryPair[]);
  validate?: (config: Config) => void;
  run: (context: ModuleContext) => Promise<void> | void;
}
