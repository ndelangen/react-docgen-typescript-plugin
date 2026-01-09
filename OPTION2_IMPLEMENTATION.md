# Option 2 Implementation: Transform Source Before Webpack

## ✅ Implementation Complete

We've successfully implemented **Approach A: Programmatic Loader Addition**. The plugin automatically sets up the loader programmatically, so users only need to add the plugin to their webpack config - no manual loader configuration required.

## How It Works

1. **Plugin (`src/plugin.ts`)**:
   - Uses `NormalModuleFactory.hooks.afterResolve` to intercept module resolution
   - Automatically adds our custom loader (`src/loader.ts`) to matching modules
   - Passes parser, compilerOptions, and generateOptions to the loader via loader options

2. **Loader (`src/loader.ts`)**:
   - Runs BEFORE webpack processes the source code
   - Calls `generateDocgenCodeBlock` which:
     - Transforms direct default exports to named const + re-export (e.g., `export default function X()` → `const DisplayName = function X(); export { DisplayName as default }`)
     - Adds docgen code blocks (displayName, \_\_docgenInfo, etc.)
   - Creates `tsProgram` lazily as needed

3. **Result**:
   - Webpack processes our transformed source, so it uses our naming (e.g., `DirectDefaultExport`)
   - No identifier divergence - webpack's naming matches what we expect
   - Works for both unit tests and webpack builds

## User Experience

Users simply add the plugin to their webpack config:

```javascript
const ReactDocgenTypeScriptPlugin = require('react-docgen-typescript-plugin');

module.exports = {
  plugins: [
    new ReactDocgenTypeScriptPlugin({
      // options...
    }),
  ],
};
```

The plugin automatically handles everything - no loader configuration needed!
