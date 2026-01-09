import path from 'node:path';

import createDebug from 'debug';
import { matcher } from 'micromatch';
import * as docGen from 'react-docgen-typescript';
import ts from 'typescript';
import type * as webpack from 'webpack';

import { type GeneratorOptions, generateDocgenCodeBlock } from './generateDocgenCodeBlock';
import type { LoaderOptions } from './types';

const debugExclude = createDebug('docgen:exclude');
const debugInclude = createDebug('docgen:include');

interface TypescriptOptions {
  /**
   * Specify the location of the tsconfig.json to use. Can not be used with
   * compilerOptions.
   **/
  tsconfigPath?: string;
  /** Specify TypeScript compiler options. Can not be used with tsconfigPath. */
  compilerOptions?: ts.CompilerOptions;
}

export type PluginOptions = docGen.ParserOptions &
  LoaderOptions &
  TypescriptOptions & {
    /** Glob patterns to ignore */
    exclude?: string[];
    /** Glob patterns to include. defaults to ts|tsx */
    include?: string[];
  };

/** Get the contents of the tsconfig in the system */
function getTSConfigFile(tsconfigPath: string): ts.ParsedCommandLine {
  try {
    const basePath = path.dirname(tsconfigPath);
    const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);

    return ts.parseJsonConfigFileContent(configFile.config, ts.sys, basePath, {}, tsconfigPath);
  } catch {
    return {} as ts.ParsedCommandLine;
  }
}

/** Create a glob matching function. */
const matchGlob = (globs?: string[]) => {
  const matchers = (globs || []).map((g) => matcher(g, { dot: true }));

  return (filename: string) => Boolean(filename && matchers.find((match) => match(filename)));
};

/** Inject typescript docgen information into modules at the end of a build */
export default class DocgenPlugin implements webpack.WebpackPluginInstance {
  public static defaultOptions = {
    setDisplayName: true,
    typePropName: 'type',
    docgenCollectionName: 'STORYBOOK_REACT_CLASSES',
  };

  private name = 'React Docgen Typescript Plugin';
  private options: PluginOptions;

  constructor(options: PluginOptions = {}) {
    this.options = options;
  }

  apply(compiler: webpack.Compiler): void {
    const pluginName = 'DocGenPlugin';
    const { docgenOptions, compilerOptions, generateOptions } = this.getOptions();
    const docGenParser = docGen.withCompilerOptions(compilerOptions, docgenOptions);
    const { exclude = [], include = ['**/**.tsx'] } = this.options;
    const isExcluded = matchGlob(exclude);
    const isIncluded = matchGlob(include);

    // Track modules and create tsProgram lazily
    const modulePaths = new Set<string>();
    let tsProgram: ts.Program | undefined;
    // Store transformed sources keyed by resource path
    const transformedSources = new Map<string, string>();

    // Use NormalModuleFactory to transform source directly in the plugin
    compiler.hooks.normalModuleFactory.tap(pluginName, (normalModuleFactory) => {
      // Collect modules that need processing
      normalModuleFactory.hooks.beforeResolve.tap(pluginName, (data) => {
        const resource = data.request;
        if (!resource || typeof resource !== 'string') {
          return;
        }

        if (isExcluded(resource)) {
          return;
        }

        if (!isIncluded(resource)) {
          return;
        }

        modulePaths.add(resource);
      });

      // Transform source in afterResolve - read original TS file and transform it
      normalModuleFactory.hooks.afterResolve.tap(pluginName, (data) => {
        const createData = (data as { createData?: { resource?: string } }).createData;
        if (!createData) {
          return;
        }

        const resource = createData.resource;
        if (!resource || typeof resource !== 'string') {
          return;
        }

        // Check if this module should be processed
        if (isExcluded(resource)) {
          debugExclude(`Module not matched in "exclude": ${resource}`);
          return;
        }

        if (!isIncluded(resource)) {
          debugExclude(`Module not matched in "include": ${resource}`);
          return;
        }

        debugInclude(`Transforming source for: ${resource}`);

        // Read the original TypeScript source file first
        const sourceCode = ts.sys.readFile(resource) || '';
        if (!sourceCode) {
          return;
        }

        // Create tsProgram lazily with all collected modules
        if (!tsProgram && modulePaths.size > 0) {
          tsProgram = ts.createProgram(Array.from(modulePaths), compilerOptions);
        }

        // Parse components and transform source
        // Use a function that creates/updates the program as needed
        const componentDocs = docGenParser.parseWithProgramProvider(resource, () => {
          if (!tsProgram) {
            tsProgram = ts.createProgram(Array.from(modulePaths), compilerOptions);
          }
          return tsProgram;
        });
        if (!componentDocs.length) {
          return;
        }

        // Transform source and add docgen code
        const transformedSource = generateDocgenCodeBlock({
          filename: resource,
          source: sourceCode,
          componentDocs,
          ...generateOptions,
        });

        // Store transformed source for injection
        transformedSources.set(resource, transformedSource);
      });
    });

    // Transform source using AST - add __docgen property to components
    // Use optimizeModules hook to modify source after loaders but before optimization
    compiler.hooks.compilation.tap(pluginName, (compilation) => {
      compilation.hooks.optimizeModules.tap(pluginName, (modules) => {
        // Convert Iterable to Array
        const modulesArray = Array.from(modules);
        for (const module of modulesArray) {
          const resource = (module as { resource?: string }).resource;
          if (!resource || typeof resource !== 'string') {
            continue;
          }

          // Only process modules that match our include/exclude patterns
          if (isExcluded(resource)) {
            continue;
          }

          if (!isIncluded(resource)) {
            continue;
          }

          const moduleSource = (module as { _source?: { source: () => string } })._source;
          if (!moduleSource) {
            continue;
          }

          // Get the current source code
          const originalSource = moduleSource.source();
          if (!originalSource) {
            continue;
          }

          // Simple AST transformation: find const declarations and add __docgen property
          // Use regex to find const declarations that look like components
          // Pattern: const ComponentName = () => ...
          const constDeclarationPattern = /const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*\([^)]*\)\s*=>/g;
          let modifiedSource = originalSource;
          const additions: Array<{ index: number; text: string }> = [];

          let match;
          while ((match = constDeclarationPattern.exec(originalSource)) !== null) {
            const componentName = match[1];
            const insertIndex = match.index + match[0].length;

            // Find the end of the statement (semicolon or end of line)
            let endIndex = originalSource.indexOf(';', insertIndex);
            if (endIndex === -1) {
              // No semicolon found, find end of line or end of file
              endIndex = originalSource.indexOf('\n', insertIndex);
              if (endIndex === -1) {
                endIndex = originalSource.length;
              }
            } else {
              endIndex += 1; // Include the semicolon
            }

            // Add the __docgen property after the const declaration
            additions.push({
              index: endIndex,
              text: `\n${componentName}.__docgen = true;`,
            });
          }

          // Apply additions in reverse order to preserve indices
          additions.reverse();
          for (const addition of additions) {
            modifiedSource =
              modifiedSource.slice(0, addition.index) + addition.text + modifiedSource.slice(addition.index);
          }

          // Replace the module source if we made changes
          if (modifiedSource !== originalSource) {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { RawSource } = require('webpack-sources');
            (module as { _source?: any })._source = new RawSource(modifiedSource);
          }
        }
      });
    });
  }

  getOptions(): {
    docgenOptions: docGen.ParserOptions;
    generateOptions: {
      docgenCollectionName: GeneratorOptions['docgenCollectionName'];
      setDisplayName: GeneratorOptions['setDisplayName'];
      typePropName: GeneratorOptions['typePropName'];
    };
    compilerOptions: ts.CompilerOptions;
  } {
    const {
      tsconfigPath = './tsconfig.json',
      compilerOptions: userCompilerOptions,
      docgenCollectionName,
      setDisplayName,
      typePropName,
      ...docgenOptions
    } = this.options;
    const { defaultOptions } = DocgenPlugin;

    let compilerOptions = {
      jsx: ts.JsxEmit.React,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.Latest,
    };

    if (userCompilerOptions) {
      compilerOptions = {
        ...compilerOptions,
        ...userCompilerOptions,
      };
    } else {
      const { options: tsOptions } = getTSConfigFile(tsconfigPath);
      compilerOptions = { ...compilerOptions, ...tsOptions };
    }

    return {
      docgenOptions: {
        shouldIncludeExpression: true,
        ...docgenOptions,
      },
      generateOptions: {
        docgenCollectionName:
          docgenCollectionName === undefined ? defaultOptions.docgenCollectionName : docgenCollectionName,
        setDisplayName: setDisplayName ?? defaultOptions.setDisplayName,
        typePropName: typePropName ?? defaultOptions.typePropName,
      },
      compilerOptions,
    };
  }
}

export type DocgenPluginType = typeof DocgenPlugin;
