import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { repoRoot, runGraph } from "./ttsc-graph-command";

type GraphNode = {
  file: string;
  id: string;
};

type GraphEdge = {
  from: string;
  to: string;
};

type TypeScriptGraph = {
  edges: GraphEdge[];
  nodes: GraphNode[];
};

const graphTimeoutMs = 120_000;

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
      typeof node.file !== "string"
    ) {
      throw new Error(
        `ttsc graph node ${index} is missing string id/file fields.`,
      );
    }
    return { file: node.file, id: node.id };
  });
  const edges = parsed.edges.map((edge, index): GraphEdge => {
    if (
      !isRecord(edge) ||
      typeof edge.from !== "string" ||
      typeof edge.to !== "string"
    ) {
      throw new Error(
        `ttsc graph edge ${index} is missing string from/to fields.`,
      );
    }
    return { from: edge.from, to: edge.to };
  });

  return { edges, nodes };
}

async function loadGraph(): Promise<TypeScriptGraph> {
  const processHandle = runGraph(["dump"], {
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

function collectDependencies(graph: TypeScriptGraph): string[] {
  const filesById = new Map(graph.nodes.map((node) => [node.id, node.file]));
  const dependencies = new Set<string>();

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
  const graph = await loadGraph();
  const dependencies = collectDependencies(graph);
  validateGraph(graph, dependencies);

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
    `Graph valid: ${graph.nodes.length} nodes, ${graph.edges.length} edges, ${packageDependencies(dependencies).length} package dependencies.`,
  );
}

try {
  await main();
} catch (error) {
  console.error(`\n[ttsc-graph] ${String(error)}`);
  process.exit(1);
}
