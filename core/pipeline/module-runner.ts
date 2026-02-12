import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import type { Config } from '../types/config.js';
import type { LayoutDirectoryPair } from '../types/layout.js';
import type { Module, ModuleContext } from '../types/module.js';

interface LoadedModule {
  module: Module;
  name: string;
}

export interface ModuleManager {
  layoutDirectoryPairs: LayoutDirectoryPair[];
  runModules: (context: ModuleContext) => Promise<void>;
}

/**
 * Creates a module manager that loads configured modules and runs them.
 * @param config - SSG configuration containing the list of module names.
 */
export const createModuleManager = async (config: Config): Promise<ModuleManager> => {
  const moduleNames = Array.isArray(config.modules) ? config.modules : [];
  const modules = await loadModules(moduleNames);

  for (const { module, name } of modules) {
    if (typeof module.validate === 'function') {
      try {
        module.validate(config);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        throw new Error(`Module "${name}" validation failed: ${err.message}`);
      }
    }
  }

  const layoutDirectoryPairs = modules.flatMap(({ module }) =>
    getModuleDirectoryPairs(module, config),
  );

  return {
    layoutDirectoryPairs,
    runModules: async (context: ModuleContext) => {
      for (const { module, name } of modules) {
        try {
          await module.run(context);
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          throw new Error(`Module "${name}" execution failed: ${err.message}`);
        }
      }
    },
  };
};

const loadModules = async (moduleNames: string[]): Promise<LoadedModule[]> => {
  if (!Array.isArray(moduleNames) || moduleNames.length === 0) {
    return [];
  }

  const loaded: LoadedModule[] = [];
  for (const moduleName of moduleNames) {
    if (!moduleName || typeof moduleName !== 'string') {
      throw new Error('Module name must be a non-empty string');
    }

    const resolvedPath = resolveModulePath(moduleName);
    const moduleModule = (await import(pathToFileURL(resolvedPath).href)) as {
      default?: Module;
    };
    const resolvedModule = (moduleModule.default ?? moduleModule) as Module;

    if (!resolvedModule || typeof resolvedModule !== 'object') {
      throw new Error(`Module "${moduleName}" did not export a valid module object`);
    }
    if (typeof resolvedModule.run !== 'function') {
      throw new Error(`Module "${moduleName}" must export a run function`);
    }

    loaded.push({ module: resolvedModule, name: moduleName });
  }

  return loaded;
};

const resolveModulePath = (moduleName: string): string => {
  const rootDir = process.cwd();
  const moduleTsPath = path.join(rootDir, 'modules', moduleName, 'module.ts');
  const moduleJsPath = path.join(rootDir, 'dist', 'modules', moduleName, 'module.js');

  if (fs.existsSync(moduleJsPath)) {
    return moduleJsPath;
  }
  if (fs.existsSync(moduleTsPath)) {
    return moduleTsPath;
  }

  throw new Error(`Module not found: ${moduleName}`);
};

const getModuleDirectoryPairs = (module: Module, config: Config): LayoutDirectoryPair[] => {
  if (!module.directoryPairs) {
    return [];
  }
  if (typeof module.directoryPairs === 'function') {
    return module.directoryPairs(config);
  }
  return module.directoryPairs;
};
