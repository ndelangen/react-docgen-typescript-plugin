# Architecture Proposal: Preventing Identifier Divergence

## Problem
Currently, we try to predict webpack's function naming (`_fixtures_DirectDefaultExport_DefaultPropValueComponent`), but webpack's actual naming is inconsistent (`DirectDefaultExport_DefaultPropValueComponent`), causing aliases to fail silently.

## Solution Options

### Option 1: Use `processAssets` Hook (Recommended)
Access webpack's compiled source after processing, extract actual function names, and inject code that references them.

**Pros:**
- Works with webpack's actual naming
- No prediction needed
- Works for both ES modules and CommonJS

**Cons:**
- More complex implementation
- Requires parsing compiled JavaScript

### Option 2: Transform Source Before Webpack (Current for Unit Tests)
Use a webpack loader to transform source BEFORE webpack processes it, so we control the naming.

**Pros:**
- We control the naming
- Works reliably
- Already implemented for unit tests

**Cons:**
- Requires loader configuration
- May conflict with other loaders

### Option 3: Reference Module Exports Directly
Instead of referencing function names, reference the module's default export directly.

**Pros:**
- Simple
- Works regardless of function naming

**Cons:**
- May not work in all module systems
- Requires module to be fully initialized

## Recommended Approach: Hybrid Solution

1. **For Unit Tests**: Continue using source transformation (already works)
2. **For Webpack**: Use `processAssets` hook to:
   - Access compiled module source
   - Extract actual function names using regex/AST parsing
   - Inject code that references those actual names

This gives us the best of both worlds: reliable transformation for tests, and accurate name extraction for webpack builds.
