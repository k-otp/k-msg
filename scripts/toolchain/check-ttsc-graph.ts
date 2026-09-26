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

type GraphDocTag = {
  name: string;
  text: string;
};

type GraphDiagnostic = {
  category: string;
  code: number;
  file?: string;
  line?: number;
  message: string;
};

type TypeScriptGraph = {
  capabilities: string[];
  diagnostics: GraphDiagnostic[];
  docTagsById: Map<string, GraphDocTag[]>;
  edges: GraphEdge[];
  nodes: GraphNode[];
};

type SpecificationCitation = {
  acknowledgement: "cited" | "excluded";
  section: string;
  symbol: string;
};

// A cold machine builds the @ttsc/lint sidecar (with the evidence contributor)
// from Go source before the graph can publish specification artifacts.
const graphTimeoutMs = 600_000;
const productionGraphConfig = "tsconfig.graph.json";
const criticalTestGraphConfig = "tsconfig.graph.test.json";
const evidenceLintConfig = "lint.evidence.config.ts";
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

  const docTagsById = new Map<string, GraphDocTag[]>();
  for (const node of parsed.nodes) {
    if (!isRecord(node) || !Array.isArray(node.docTags)) continue;
    const tags = node.docTags.filter(
      (tag): tag is GraphDocTag =>
        isRecord(tag) &&
        typeof tag.name === "string" &&
        typeof tag.text === "string",
    );
    docTagsById.set(String(node.id), tags);
  }

  const diagnostics = (
    Array.isArray(parsed.diagnostics) ? parsed.diagnostics : []
  ).map((diagnostic, index): GraphDiagnostic => {
    if (
      !isRecord(diagnostic) ||
      typeof diagnostic.code !== "number" ||
      typeof diagnostic.category !== "string" ||
      typeof diagnostic.message !== "string" ||
      (diagnostic.file !== undefined && typeof diagnostic.file !== "string") ||
      (diagnostic.line !== undefined && typeof diagnostic.line !== "number")
    ) {
      throw new Error(
        `ttsc graph diagnostic ${index} is missing code/category/message fields.`,
      );
    }
    return {
      category: diagnostic.category,
      code: diagnostic.code,
      ...(typeof diagnostic.file === "string" ? { file: diagnostic.file } : {}),
      ...(typeof diagnostic.line === "number" ? { line: diagnostic.line } : {}),
      message: diagnostic.message,
    };
  });

  const provenance = isRecord(parsed.provenance) ? parsed.provenance : {};
  const capabilities = Array.isArray(provenance.capabilities)
    ? provenance.capabilities.filter(
        (capability): capability is string => typeof capability === "string",
      )
    : [];

  return { capabilities, diagnostics, docTagsById, edges, nodes };
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

// Examples need runtime-specific ambient types (Workers, Pages, Durable Objects)
// that the shared graph program does not load; their tsconfig.workspace.json
// overlays type-check them. Anywhere else, a compiler error means some edges
// were resolved against an erroneous program and cannot be trusted.
function validateCompilerDiagnostics(graph: TypeScriptGraph): void {
  const blocking = graph.diagnostics.filter(
    (diagnostic) =>
      diagnostic.category === "error" &&
      !(diagnostic.file ?? "").replaceAll("\\", "/").startsWith("examples/"),
  );
  if (blocking.length > 0) {
    throw new Error(
      `The graph program has compiler errors outside examples:\n${blocking
        .slice(0, 20)
        .map(
          (diagnostic) =>
            `${diagnostic.file ?? "<global>"}:${diagnostic.line ?? 0} TS${diagnostic.code} ${diagnostic.message}`,
        )
        .join("\n")}`,
    );
  }
}

function acknowledgementFor(
  graph: TypeScriptGraph,
  symbol: string,
  section: string,
): SpecificationCitation["acknowledgement"] | null {
  let acknowledgement: SpecificationCitation["acknowledgement"] | null = null;
  for (const tag of graph.docTagsById.get(symbol) ?? []) {
    if (tag.name !== "evidence" && tag.name !== "evidenceExclude") continue;
    const target = tag.text.trim().split(/\s+/, 1)[0];
    if (target !== section) continue;

    const resolved = tag.name === "evidence" ? "cited" : "excluded";
    if (acknowledgement !== null && acknowledgement !== resolved) {
      throw new Error(
        `${symbol} both cites and excludes ${section}; keep one acknowledgement.`,
      );
    }
    acknowledgement = resolved;
  }
  return acknowledgement;
}

function collectSpecificationEvidence(
  graph: TypeScriptGraph,
): SpecificationCitation[] {
  const sections = new Set(
    graph.nodes
      .filter((node) => node.kind === "markdown_section")
      .map((node) => node.id),
  );
  const citations: SpecificationCitation[] = [];
  for (const edge of graph.edges) {
    if (edge.kind !== "doc_ref" || !sections.has(edge.to)) continue;
    const acknowledgement = acknowledgementFor(graph, edge.from, edge.to);
    if (!acknowledgement) {
      throw new Error(
        `Graph doc_ref ${edge.from} -> ${edge.to} has no matching @evidence or @evidenceExclude tag.`,
      );
    }
    citations.push({ acknowledgement, section: edge.to, symbol: edge.from });
  }

  return citations.sort(
    (left, right) =>
      left.section.localeCompare(right.section) ||
      left.symbol.localeCompare(right.symbol),
  );
}

function validateSpecificationEvidence(
  graph: TypeScriptGraph,
  citations: readonly SpecificationCitation[],
): void {
  if (!graph.capabilities.includes("artifactNodes")) {
    throw new Error(
      `The graph carries no specification artifacts. ${productionGraphConfig} must point @ttsc/lint at ${evidenceLintConfig}, and the evidence plugin must build (run bun run typecheck for its diagnostics).`,
    );
  }
  if (citations.length === 0) {
    throw new Error(
      `The evidence plugin published no citations. Check that the documents governed by ${evidenceLintConfig} still exist and that the @evidence targets match their current section anchors (run bun run typecheck for its diagnostics).`,
    );
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

function renderSnapshot(
  dependencies: readonly string[],
  citations: readonly SpecificationCitation[],
): string {
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
  const citationRows = citations
    .map(
      (citation) =>
        `| \`${citation.section}\` | ${citation.acknowledgement} | \`${citation.symbol}\` |`,
    )
    .join("\n");

  return `# TypeScript Architecture Graph

This file is generated by \`bun run graph:ttsc:snapshot\` from the compiler-resolved \`@ttsc/graph\` index defined by \`tsconfig.graph.json\`. CI verifies it with \`bun run graph:ttsc:check\`.

## Enforced Invariants

- Publishable packages cannot depend on applications, examples, or repository tooling.
- Package-level semantic dependencies must remain acyclic.
- Built-in Provider implementations must keep their reviewed request-context and transport-capability paths.
- Retry-policy parsing and provider-error normalization must retain status and retry-after graph connections.
- Critical provider and retry tests are compiler-indexed through \`${criticalTestGraphConfig}\`.
- The production graph program must be free of compiler errors outside \`examples/\`, whose runtime-specific ambient types are checked by their own overlays.
- Specification sections governed by \`${evidenceLintConfig}\` must stay indexed as \`doc_ref\` edges from the code that answers them.
- Architecture dependency changes must update this snapshot explicitly.
- Edge counts are intentionally omitted so implementation-only changes do not create snapshot churn.

## Runtime Dependencies

| Source | Depends on |
| --- | --- |
${rows}

## Specification Evidence

\`bun run typecheck\` fails until every section below is acknowledged and each acknowledgement carries a review whose fingerprint matches the section's current text. This table records where those acknowledgements live.

| Section | Acknowledgement | Declared on |
| --- | --- | --- |
${citationRows}

## Compatibility Boundary

\`apps/docs\` is intentionally absent. Astro, Starlight, and TypeDoc remain on the docs-local TypeScript 6 compiler and are validated by \`bun run docs:check\`. The graph gate covers the TypeScript 7 runtime, CLI, tooling, examples, and the specification sections that evidence citations reach, without claiming to model documentation-site routes or rendered UI.
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
  validateCompilerDiagnostics(graph);
  validateProviderContracts(graph);
  validateRetryPolicyContracts(graph);
  const citations = collectSpecificationEvidence(graph);
  validateSpecificationEvidence(graph, citations);
  await validateCriticalTestConfig();
  validateCriticalTestGraph(criticalTestGraph);

  const snapshot = renderSnapshot(dependencies, citations);
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
    `Graph valid: ${graph.nodes.length} production nodes, ${graph.edges.length} production edges, ${criticalTestGraph.nodes.length} critical-test nodes, ${criticalTestGraph.edges.length} critical-test edges, ${packageDependencies(dependencies).length} package dependencies, ${citations.length} specification acknowledgements, ${graph.diagnostics.length} tolerated compiler diagnostics.`,
  );
}

try {
  await main();
} catch (error) {
  console.error(`\n[ttsc-graph] ${String(error)}`);
  process.exit(1);
}
