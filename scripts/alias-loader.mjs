// Minimal ESM loader to map TS path aliases to real files during dev
// Supports: @engine/*, @api/*, @student/*, @teacher/*

const aliasMap = [
  { prefix: '@engine/', target: new URL('../packages/engine/src/', import.meta.url) },
  { prefix: '@api/', target: new URL('../services/api/src/', import.meta.url) },
  { prefix: '@student/', target: new URL('../apps/student/src/', import.meta.url) },
  { prefix: '@teacher/', target: new URL('../apps/teacher/src/', import.meta.url) }
];

/**
 * Node ESM loader hook
 * @param {string} specifier
 * @param {object} context
 * @param {Function} defaultResolve
 */
export async function resolve(specifier, context, defaultResolve) {
  for (const { prefix, target } of aliasMap) {
    if (specifier.startsWith(prefix)) {
      const subpath = specifier.slice(prefix.length);
      // Default to .ts if no extension provided
      const hasExt = /\.[a-zA-Z0-9]+$/.test(subpath);
      const resolved = new URL(subpath + (hasExt ? '' : '.ts'), target);
      return defaultResolve(resolved.href, context, defaultResolve);
    }
  }
  // Fallback to Node default resolver
  return defaultResolve(specifier, context, defaultResolve);
}


