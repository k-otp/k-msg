import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { repoRoot, runGraph } from "./ttsc-graph-command";

type GraphNode = {
  external?: boolean;
  file: string;
  id: string;
  kind: string;
  name: string;
  qualifiedName?: string;
};

type GraphEdge = {
  from: string;
  kind: string;
  to: string;
};

type TypeScriptGraph = {
  edges: GraphEdge[];
  nodes: GraphNode[];
};

const graphTimeoutMs = 120_000;
const productionGraphConfig = "tsconfig.graph.json";
const criticalTestGraphConfig = "tsconfig.graph.test.json";
const criticalTestFiles = [
  "packages/core/src/errors.test.ts",
  "packages/provider/src/aligo/aligo.transport.test.ts",
  "packages/provider/src/iwinv/iwinv.transport.test.ts",
  "packages/provider/src/provider.transport-capabilities.test.ts",
  "packages/provider/src/shared/provider-transport.test.ts",
] as const;

const snapshotPath = path.join(
  repoRoot,
  "docs",
  "architecture",
  "typescript-graph.md",
);

function areaForFile(file: string | undefined): string | null {
  const normalized = file?.replaceAll("\\", "/");
  if (!normalized || normalized.includes("node_modules")) {
    return null;
  }

  const match = /^(apps|examples|packages|scripts)\/([^/]+)/.exec(normalized);
  return match ? `${match[1]}/${match[2]}` : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseGraph(output: string): TypeScriptGraph {
  let parsed: unknown;
  try {
    parsed = JSON.parse(output);
  } catch (error) {
    throw new Error(
      `ttsc graph returned invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (
    !isRecord(parsed) ||
    !Array.isArray(parsed.nodes) ||
    !Array.isArray(parsed.edges)
  ) {
    throw new Error("ttsc graph output must contain nodes and edges arrays.");
  }

  const nodes = parsed.nodes.map((node, index): GraphNode => {
    if (
      !isRecord(node) ||
      typeof node.id !== "string" ||
      typeof node.file !== "string" ||
      typeof node.kind !== "string" ||
      typeof node.name !== "string"
    ) {
      throw new Error(
        `ttsc graph node ${index} is missing string id/file/kind/name fields.`,
      );
    }
    return {
      ...(typeof node.external === "boolean"
        ? { external: node.external }
        : {}),
      file: node.file,
      id: node.id,
      kind: node.kind,
      name: node.name,
      ...(typeof node.qualifiedName === "string"
        ? { qualifiedName: node.qualifiedName }
        : {}),
    };
  });
  const edges = parsed.edges.map((edge, index): GraphEdge => {
    if (
      !isRecord(edge) ||
      typeof edge.from !== "string" ||
      typeof edge.to !== "string" ||
      typeof edge.kind !== "string"
    ) {
      throw new Error(
        `ttsc graph edge ${index} is missing string from/to/kind fields.`,
      );
    }
    return { from: edge.from, kind: edge.kind, to: edge.to };
  });

  return { edges, nodes };
}

async function loadGraph(tsconfig: string): Promise<TypeScriptGraph> {
  const processHandle = runGraph(["dump", "--tsconfig", tsconfig], {
    stderr: "pipe",
    stdout: "pipe",
  });
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const completion = Promise.all([
    processHandle.stdout
      ? new Response(processHandle.stdout).text()
      : Promise.resolve(""),
    processHandle.stderr
      ? new Response(processHandle.stderr).text()
      : Promise.resolve(""),
    processHandle.exited,
  ]);
  const timedOut = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      processHandle.kill();
      reject(
        new Error(`ttsc graph dump timed out after ${graphTimeoutMs / 1000}s.`),
      );
    }, graphTimeoutMs);
  });

  let stdout: string;
  let stderr: string;
  let exitCode: number;
  try {
    [stdout, stderr, exitCode] = await Promise.race([completion, timedOut]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }

  if (exitCode !== 0) {
    throw new Error(`ttsc graph dump failed:\n${stderr.trim()}`);
  }

  return parseGraph(stdout);
}

function requireSymbol(graph: TypeScriptGraph, id: string): GraphNode {
  const node = graph.nodes.find((candidate) => candidate.id === id);
  if (!node) {
    throw new Error(`Expected graph symbol is missing: ${id}`);
  }
  return node;
}

function hasEdge(
  graph: TypeScriptGraph,
  from: string,
  to: string,
  kind: string,
): boolean {
  return graph.edges.some(
    (edge) => edge.from === from && edge.to === to && edge.kind === kind,
  );
}

function requireEdge(
  graph: TypeScriptGraph,
  from: string,
  to: string,
  kind: string,
): void {
  requireSymbol(graph, from);
  requireSymbol(graph, to);
  if (!hasEdge(graph, from, to, kind)) {
    throw new Error(`Expected graph edge is missing: ${from} -${kind}-> ${to}`);
  }
}

function hasCallPath(
  graph: TypeScriptGraph,
  from: string,
  to: string,
): boolean {
  requireSymbol(graph, from);
  requireSymbol(graph, to);

  const adjacency = new Map<string, string[]>();
  for (const edge of graph.edges) {
    if (edge.kind !== "calls") continue;
    const targets = adjacency.get(edge.from) ?? [];
    targets.push(edge.to);
    adjacency.set(edge.from, targets);
  }

  const visited = new Set([from]);
  const pending = [from];
  while (pending.length > 0) {
    const current = pending.shift();
    if (!current) break;
    if (current === to) return true;

    for (const target of adjacency.get(current) ?? []) {
      if (visited.has(target)) continue;
      visited.add(target);
      pending.push(target);
    }
  }

  return false;
}

function requireCallPath(
  graph: TypeScriptGraph,
  from: string,
  to: string,
): void {
  if (!hasCallPath(graph, from, to)) {
    throw new Error(`Expected graph call path is missing: ${from} -> ${to}`);
  }
}

function forbidCallPath(
  graph: TypeScriptGraph,
  from: string,
  to: string,
): void {
  if (hasCallPath(graph, from, to)) {
    throw new Error(`Forbidden graph call path detected: ${from} -> ${to}`);
  }
}

function validateProviderContracts(graph: TypeScriptGraph): void {
  const provider = "packages/core/src/provider.ts#Provider:interface";
  const providerContext =
    "packages/core/src/provider.ts#ProviderRequestContext:interface";
  const fetchWithContext =
    "packages/provider/src/shared/provider-transport.ts#fetchWithProviderContext:function";
  const toAbortError =
    "packages/provider/src/shared/provider-transport.ts#toProviderAbortError:function";
  const implementations = [
    "packages/provider/src/aligo/provider.send.ts#AligoSendProvider:class",
    "packages/provider/src/iwinv/provider.send.ts#IWINVSendProvider:class",
    "packages/provider/src/providers/mock/mock.provider.ts#MockProvider:class",
    "packages/provider/src/solapi/provider.ts#SolapiProvider:class",
  ];

  requireSymbol(graph, provider);
  const actualImplementations = graph.edges
    .filter((edge) => edge.kind === "implements" && edge.to === provider)
    .map((edge) => edge.from)
    .sort();
  if (actualImplementations.join("\n") !== implementations.sort().join("\n")) {
    throw new Error(
      `Provider implementation set changed. Update transport capabilities and graph contracts together.\nExpected:\n${implementations.join("\n")}\nActual:\n${actualImplementations.join("\n")}`,
    );
  }

  const contextConsumers = [
    "packages/provider/src/aligo/provider.send.ts#AligoSendProvider.send:method",
    "packages/provider/src/iwinv/provider.send.ts#IWINVSendProvider.getDeliveryStatus:method",
    "packages/provider/src/iwinv/provider.send.ts#IWINVSendProvider.send:method",
    "packages/provider/src/providers/mock/mock.provider.ts#MockProvider.send:method",
    "packages/provider/src/solapi/provider.ts#SolapiProvider.getDeliveryStatus:method",
    "packages/provider/src/solapi/provider.ts#SolapiProvider.send:method",
  ];
  for (const consumer of contextConsumers) {
    requireEdge(graph, consumer, providerContext, "type_ref");
  }

  requireEdge(
    graph,
    fetchWithContext,
    "packages/core/src/provider.ts#ProviderRequestContext.fetch:variable",
    "accesses",
  );
  requireEdge(
    graph,
    fetchWithContext,
    "packages/core/src/provider.ts#ProviderRequestContext.signal:variable",
    "accesses",
  );

  const contextAwareTransports = [
    "packages/provider/src/aligo/provider.send.ts#AligoSendProvider.send:method",
    "packages/provider/src/iwinv/provider.send.ts#IWINVSendProvider.getDeliveryStatus:method",
    "packages/provider/src/iwinv/provider.send.ts#IWINVSendProvider.send:method",
  ];
  for (const transport of contextAwareTransports) {
    requireCallPath(graph, transport, fetchWithContext);
  }

  const mockSend =
    "packages/provider/src/providers/mock/mock.provider.ts#MockProvider.send:method";
  requireCallPath(graph, mockSend, toAbortError);
  forbidCallPath(graph, mockSend, fetchWithContext);

  const solapiTransports = [
    "packages/provider/src/solapi/provider.ts#SolapiProvider.getDeliveryStatus:method",
    "packages/provider/src/solapi/provider.ts#SolapiProvider.send:method",
  ];
  for (const transport of solapiTransports) {
    forbidCallPath(graph, transport, fetchWithContext);
    forbidCallPath(graph, transport, toAbortError);
  }
}

function validateRetryPolicyContracts(graph: TypeScriptGraph): void {
  const parser =
    "packages/core/src/errors.ts#parseErrorRetryPolicyFromJson:function";
  const validator =
    "packages/core/src/errors.ts#validateErrorRetryPolicy:function";
  const normalizer =
    "packages/core/src/errors.ts#normalizeProviderError:function";
  const retryAfterResolver =
    "packages/core/src/errors.ts#resolveRetryAfter:variable";

  requireCallPath(graph, parser, validator);
  for (const field of ["retryableStatuses", "nonRetryableStatuses"]) {
    requireEdge(
      graph,
      validator,
      `packages/core/src/errors.ts#ErrorRetryPolicy.${field}:variable`,
      "accesses",
    );
  }

  requireCallPath(graph, normalizer, retryAfterResolver);
  for (const field of ["byCode", "byStatus"]) {
    requireEdge(
      graph,
      retryAfterResolver,
      `packages/core/src/errors.ts#RetryAfterPolicy.${field}:variable`,
      "accesses",
    );
  }
}

async function validateCriticalTestConfig(): Promise<void> {
  const configPath = path.join(repoRoot, criticalTestGraphConfig);
  const raw = JSON.parse(await readFile(configPath, "utf8")) as unknown;
  if (!isRecord(raw) || !Array.isArray(raw.include)) {
    throw new Error(
      `${criticalTestGraphConfig} must declare an include array.`,
    );
  }

  const actual = raw.include.filter(
    (entry): entry is string => typeof entry === "string",
  );
  if (
    actual.length !== raw.include.length ||
    actual.sort().join("\n") !== [...criticalTestFiles].sort().join("\n")
  ) {
    throw new Error(
      `${criticalTestGraphConfig} must contain the reviewed critical-test roots exactly.`,
    );
  }

  await Promise.all(
    criticalTestFiles.map((file) => access(path.join(repoRoot, file))),
  );
}

function validateCriticalTestGraph(graph: TypeScriptGraph): void {
  if (graph.nodes.length === 0 || graph.edges.length === 0) {
    throw new Error("The critical-test TypeScript graph is empty.");
  }

  for (const id of [
    "packages/core/src/errors.ts#normalizeProviderError:function",
    "packages/core/src/errors.ts#parseErrorRetryPolicyFromJson:function",
    "packages/provider/src/aligo/provider.send.ts#AligoSendProvider:class",
    "packages/provider/src/iwinv/provider.send.ts#IWINVSendProvider:class",
    "packages/provider/src/providers/mock/mock.provider.ts#MockProvider:class",
    "packages/provider/src/shared/provider-transport.ts#fetchWithProviderContext:function",
    "packages/provider/src/solapi/provider.ts#SolapiProvider:class",
  ]) {
    requireSymbol(graph, id);
  }
}

async function readSnapshot(): Promise<string> {
  try {
    return await readFile(snapshotPath, "utf8");
  } catch (error) {
    if (isRecord(error) && error.code === "ENOENT") {
      return "";
    }
    throw error;
  }
}

async function collectWorkspacePackageAreas(): Promise<Map<string, string>> {
  const packageAreas = new Map<string, string>();
  const packageManifests = new Bun.Glob("packages/*/package.json");

  for await (const manifestPath of packageManifests.scan({ cwd: repoRoot })) {
    const manifest = await Bun.file(path.join(repoRoot, manifestPath)).json();
    if (
      isRecord(manifest) &&
      typeof manifest.name === "string" &&
      manifest.name.length > 0
    ) {
      packageAreas.set(
        manifest.name,
        path.dirname(manifestPath).replaceAll("\\", "/"),
      );
    }
  }

  return packageAreas;
}

function packageNameForSpecifier(specifier: string): string {
  const segments = specifier.split("/");
  return specifier.startsWith("@")
    ? segments.slice(0, 2).join("/")
    : (segments[0] ?? specifier);
}

async function collectReExportDependencies(): Promise<string[]> {
  const packageAreas = await collectWorkspacePackageAreas();
  const dependencies = new Set<string>();
  const sources = new Bun.Glob("packages/*/src/**/*.ts");
  const reExportPattern =
    /\bexport\s+(?:type\s+)?(?:\*[^;]*?|\{[^;]*?\})\s+from\s+["']([^"']+)["']/g;

  for await (const sourcePath of sources.scan({ cwd: repoRoot })) {
    if (/\.(?:spec|test)\.ts$/.test(sourcePath)) {
      continue;
    }

    const source = areaForFile(sourcePath);
    if (!source) {
      continue;
    }

    const contents = await Bun.file(path.join(repoRoot, sourcePath)).text();
    for (const match of contents.matchAll(reExportPattern)) {
      const specifier = match[1];
      if (!specifier) {
        continue;
      }

      const target = packageAreas.get(packageNameForSpecifier(specifier));
      if (target && target !== source) {
        dependencies.add(`${source} -> ${target}`);
      }
    }
  }

  return [...dependencies];
}

async function collectDependencies(graph: TypeScriptGraph): Promise<string[]> {
  const filesById = new Map(graph.nodes.map((node) => [node.id, node.file]));
  const dependencies = new Set(await collectReExportDependencies());

  for (const edge of graph.edges) {
    const source = areaForFile(filesById.get(edge.from));
    const target = areaForFile(filesById.get(edge.to));
    if (source && target && source !== target) {
      dependencies.add(`${source} -> ${target}`);
    }
  }

  return [...dependencies].sort();
}

function packageDependencies(dependencies: readonly string[]): string[] {
  return dependencies.filter(
    (dependency) =>
      dependency.startsWith("packages/") &&
      dependency.includes(" -> packages/"),
  );
}

function findPackageCycle(dependencies: readonly string[]): string[] | null {
  const adjacency = new Map<string, Set<string>>();
  for (const dependency of packageDependencies(dependencies)) {
    const [source, target] = dependency.split(" -> ") as [string, string];
    const targets = adjacency.get(source) ?? new Set<string>();
    targets.add(target);
    adjacency.set(source, targets);
  }

  const visited = new Set<string>();
  const active = new Set<string>();
  const stack: string[] = [];

  function visit(area: string): string[] | null {
    if (active.has(area)) {
      const cycleStart = stack.indexOf(area);
      return [...stack.slice(cycleStart), area];
    }
    if (visited.has(area)) {
      return null;
    }

    visited.add(area);
    active.add(area);
    stack.push(area);
    for (const target of adjacency.get(area) ?? []) {
      const cycle = visit(target);
      if (cycle) {
        return cycle;
      }
    }
    stack.pop();
    active.delete(area);
    return null;
  }

  for (const area of adjacency.keys()) {
    const cycle = visit(area);
    if (cycle) {
      return cycle;
    }
  }

  return null;
}

function validateGraph(
  graph: TypeScriptGraph,
  dependencies: readonly string[],
): void {
  if (graph.nodes.length === 0 || graph.edges.length === 0) {
    throw new Error("The TypeScript graph is empty.");
  }

  const forbidden = dependencies.filter((dependency) => {
    if (!dependency.startsWith("packages/")) {
      return false;
    }
    const target = dependency.split(" -> ")[1] ?? "";
    return !target.startsWith("packages/");
  });
  if (forbidden.length > 0) {
    throw new Error(
      `Publishable packages must not depend on applications, examples, or tooling:\n${forbidden.join("\n")}`,
    );
  }

  const cycle = findPackageCycle(dependencies);
  if (cycle) {
    throw new Error(`Package dependency cycle detected: ${cycle.join(" -> ")}`);
  }

  const requiredEdges = [
    "apps/cli -> packages/core",
    "packages/k-msg -> packages/core",
    "packages/k-msg -> packages/messaging",
    "packages/messaging -> packages/core",
    "packages/provider -> packages/core",
  ];
  const missingEdges = requiredEdges.filter(
    (dependency) => !dependencies.includes(dependency),
  );
  if (missingEdges.length > 0) {
    throw new Error(
      `Expected graph anchors are missing; check graph coverage:\n${missingEdges.join("\n")}`,
    );
  }
}

function renderSnapshot(dependencies: readonly string[]): string {
  const architectureDependencies = dependencies.filter(
    (dependency) =>
      (dependency.startsWith("packages/") ||
        dependency.startsWith("apps/cli")) &&
      dependency.includes(" -> packages/"),
  );
  const rows = architectureDependencies
    .map((dependency) => {
      const [source, target] = dependency.split(" -> ");
      return `| \`${source}\` | \`${target}\` |`;
    })
    .join("\n");

  return `# TypeScript Architecture Graph

This file is generated by \`bun run graph:ttsc:snapshot\` from the compiler-resolved \`@ttsc/graph\` index defined by \`tsconfig.graph.json\`. CI verifies it with \`bun run graph:ttsc:check\`.

## Enforced Invariants

- Publishable packages cannot depend on applications, examples, or repository tooling.
- Package-level semantic dependencies must remain acyclic.
- Built-in Provider implementations must keep their reviewed request-context and transport-capability paths.
- Retry-policy parsing and provider-error normalization must retain status and retry-after graph connections.
- Critical provider and retry tests are compiler-indexed through \`${criticalTestGraphConfig}\`.
- Architecture dependency changes must update this snapshot explicitly.
- Edge counts are intentionally omitted so implementation-only changes do not create snapshot churn.

## Runtime Dependencies

| Source | Depends on |
| --- | --- |
${rows}

## Compatibility Boundary

\`apps/docs\` is intentionally absent. Astro, Starlight, and TypeDoc remain on the docs-local TypeScript 6 compiler and are validated by \`bun run docs:check\`. The graph gate covers the TypeScript 7 runtime, CLI, tooling, and examples without claiming to model Markdown routes or rendered documentation UI.
`.trimEnd();
}

async function main(): Promise<void> {
  const write = process.argv.includes("--write");
  const [graph, criticalTestGraph] = await Promise.all([
    loadGraph(productionGraphConfig),
    loadGraph(criticalTestGraphConfig),
  ]);
  const dependencies = await collectDependencies(graph);
  validateGraph(graph, dependencies);
  validateProviderContracts(graph);
  validateRetryPolicyContracts(graph);
  await validateCriticalTestConfig();
  validateCriticalTestGraph(criticalTestGraph);

  const snapshot = renderSnapshot(dependencies);
  if (write) {
    await mkdir(path.dirname(snapshotPath), { recursive: true });
    await writeFile(snapshotPath, `${snapshot}\n`, "utf8");
    console.log(`Wrote ${path.relative(repoRoot, snapshotPath)}.`);
  } else {
    const current = await readSnapshot();
    if (current !== `${snapshot}\n`) {
      throw new Error(
        "TypeScript architecture snapshot is stale. Run bun run graph:ttsc:snapshot and review the dependency change.",
      );
    }
  }

  console.log(
    `Graph valid: ${graph.nodes.length} production nodes, ${graph.edges.length} production edges, ${criticalTestGraph.nodes.length} critical-test nodes, ${criticalTestGraph.edges.length} critical-test edges, ${packageDependencies(dependencies).length} package dependencies.`,
  );
}

try {
  await main();
} catch (error) {
  console.error(`\n[ttsc-graph] ${String(error)}`);
  process.exit(1);
}
