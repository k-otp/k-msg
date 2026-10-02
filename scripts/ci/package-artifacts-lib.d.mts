// Types for the exports of package-artifacts-lib.mjs that TypeScript scripts
// import. The library stays plain JavaScript so Node can run it unbuilt;
// declare an export here before a TypeScript script imports it.

/**
 * Counts an artifact's modules by the package that owns them, from the
 * sources of its linked sourcemap.
 */
export function countModulesByPackage(
  artifactFile: string,
  packageDir: string,
):
  | { counts: Map<string, number>; problem?: undefined }
  | { problem: string; counts?: undefined };
