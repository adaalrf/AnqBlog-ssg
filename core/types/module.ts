import type { Config } from './config.js';
import type { LayoutDirectoryPair } from './layout.js';

/**
 * UI slot API exposed by core for modules to inject layout fragments.
 */
export interface ModuleUiApi {
  setSlot: (slot: string, content: string) => void;
  appendSlot: (slot: string, content: string) => void;
}

/**
 * Context passed to module functions.
 * @property config - The merged SSG configuration.
 * @property ui - Slot-based UI injection API.
 */
export interface ModuleContext {
  config: Config;
  ui: ModuleUiApi;
}

/**
 * Shape of a module that extends the generator.
 */
export interface Module {
  name?: string;
  directoryPairs?: LayoutDirectoryPair[] | ((config: Config) => LayoutDirectoryPair[]);
  validate?: (config: Config) => void;
  beforeRun?: (context: ModuleContext) => Promise<void> | void;
  run: (context: ModuleContext) => Promise<void> | void;
  afterRun?: (context: ModuleContext) => Promise<void> | void;
}
