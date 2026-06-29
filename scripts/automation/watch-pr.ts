import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type Args = {
  commentBody?: string;
  intervalMinutes: number;
  json: boolean;
  once: boolean;
  owner?: string;
  postRereviewComment: boolean;
  prNumber: number;
  remote: string;
  repo?: string;
  stateFile: string;
};

type WatchState = {
  lastCommentedHeadSha?: string;
  lastSnapshotKey?: string;
};

type ReviewThreadSummary = {
  author?: string;
  body?: string;
  isOutdated: boolean;
  line?: number;
  path?: string;
  url?: string;
};

type CheckSummary = {
  conclusion?: string | null;
  kind: "check-run" | "status-context";
  name: string;
  status: string;
  url?: string;
};

type Snapshot = {
  failingChecks: CheckSummary[];
  headRefName: string;
  headSha: string;
  pendingChecks: CheckSummary[];
  prNumber: number;
  title: string;
  unresolvedReviews: ReviewThreadSummary[];
  url: string;
};

type GraphqlPullRequestResponse = {
  repository: {
    pullRequest: null | {
      headRefName: string;
      headRefOid: string;
      number: number;
      reviewThreads: {
        nodes: Array<{
          comments: {
            nodes: Array<{
              author: { login: string } | null;
              body: string;
              url: string;
            }>;
          };
          isOutdated: boolean;
          isResolved: boolean;
          line: number | null;
          path: string | null;
        }>;
        pageInfo: {
          endCursor: string | null;
          hasNextPage: boolean;
        };
      };
      title: string;
      url: string;
    };
  };
};

type CheckRunsResponse = {
  check_runs?: Array<{
    conclusion: string | null;
    details_url?: string | null;
    html_url?: string | null;
    name: string;
    status: string;
  }>;
};

type CombinedStatusResponse = {
  statuses?: Array<{
    context: string;
    state: string;
    target_url?: string | null;
  }>;
};

type GithubRestPage<T> = {
  body: T;
  nextUrl?: string;
};

type CheckRunItem = NonNullable<CheckRunsResponse["check_runs"]>[number];
type StatusItem = NonNullable<CombinedStatusResponse["statuses"]>[number];

function parseArgs(argv: string[]): Args {
  const out: Partial<Args> = {
    intervalMinutes: 10,
    json: false,
    once: false,
    postRereviewComment: false,
    remote: "origin",
    stateFile: path.join(process.cwd(), ".cache", "pr-watch-state.json"),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const raw = argv[index];
    if (!raw) continue;

    const [flag, inlineValue] = raw.startsWith("--")
      ? raw.split("=", 2)
      : [raw];
    const nextValue = inlineValue ?? argv[index + 1];
    const readValue = (): string => {
      if (inlineValue !== undefined) return inlineValue;
      if (nextValue === undefined) {
        throw new Error(`Missing value for ${flag}`);
      }
      index += 1;
      return nextValue;
    };

    switch (flag) {
      case "--pr":
        out.prNumber = Number.parseInt(readValue(), 10);
        break;
      case "--owner":
        out.owner = readValue();
        break;
      case "--repo":
        out.repo = readValue();
        break;
      case "--interval-minutes":
        out.intervalMinutes = Number.parseFloat(readValue());
        break;
      case "--state-file":
        out.stateFile = readValue();
        break;
      case "--comment-body":
        out.commentBody = readValue();
        break;
      case "--remote":
        out.remote = readValue();
        break;
      case "--json":
        out.json = true;
        break;
      case "--once":
        out.once = true;
        break;
      case "--post-rereview-comment":
        out.postRereviewComment = true;
        break;
      default:
        throw new Error(`Unknown argument: ${raw}`);
    }
  }

  if (!Number.isInteger(out.prNumber) || (out.prNumber ?? 0) <= 0) {
    throw new Error(
      "Usage: bun run scripts/automation/watch-pr.ts --pr <number>",
    );
  }

  if (
    !Number.isFinite(out.intervalMinutes) ||
    (out.intervalMinutes ?? 0) <= 0
  ) {
    throw new Error("--interval-minutes must be a positive number");
  }

  return out as Args;
}

function getGithubToken(): string {
  const token = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN;
  if (!token || token.trim().length === 0) {
    throw new Error("Set GH_TOKEN or GITHUB_TOKEN before running pr watch");
  }
  return token;
}

function resolveRepository(args: Args): { owner: string; repo: string } {
  if (args.owner && args.repo) {
    return { owner: args.owner, repo: args.repo };
  }

  const result = spawnSync(
    "git",
    ["config", "--get", `remote.${args.remote}.url`],
    {
      cwd: process.cwd(),
      encoding: "utf8",
    },
  );

  if (result.status !== 0) {
    throw new Error(
      `Unable to resolve remote.${args.remote}.url; pass --owner and --repo explicitly`,
    );
  }

  const remoteUrl = result.stdout.trim();
  const match =
    /github\.com[:/](?<owner>[^/]+)\/(?<repo>[^/.]+?)(?:\.git)?$/.exec(
      remoteUrl,
    );
  if (!match?.groups?.owner || !match.groups.repo) {
    throw new Error(
      `Unable to parse GitHub owner/repo from remote URL '${remoteUrl}'`,
    );
  }

  return {
    owner: args.owner ?? match.groups.owner,
    repo: args.repo ?? match.groups.repo,
  };
}

async function githubGraphql<T>(
  token: string,
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "k-msg-pr-watch",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(
      `GitHub GraphQL request failed (${response.status}): ${await response.text()}`,
    );
  }

  const payload = (await response.json()) as {
    data?: T;
    errors?: Array<{ message: string }>;
  };
  if (payload.errors && payload.errors.length > 0) {
    throw new Error(
      `GitHub GraphQL error: ${payload.errors.map((entry) => entry.message).join("; ")}`,
    );
  }
  if (!payload.data) {
    throw new Error("GitHub GraphQL response did not include data");
  }
  return payload.data;
}

function parseNextLink(value: string | null): string | undefined {
  if (!value) return undefined;

  for (const part of value.split(",")) {
    const match = /<([^>]+)>;\s*rel="([^"]+)"/.exec(part.trim());
    if (match?.[2] === "next") {
      return match[1];
    }
  }

  return undefined;
}

async function githubRestPage<T>(
  token: string,
  url: string,
): Promise<GithubRestPage<T>> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "k-msg-pr-watch",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!response.ok) {
    throw new Error(
      `GitHub REST request failed (${response.status}): ${await response.text()}`,
    );
  }

  return {
    body: (await response.json()) as T,
    nextUrl: parseNextLink(response.headers.get("link")),
  };
}

async function collectPaginatedItems<TResponse, TItem>(input: {
  pickItems: (body: TResponse) => TItem[];
  token: string;
  url: string;
}): Promise<TItem[]> {
  const items: TItem[] = [];
  let nextUrl: string | undefined = input.url;

  while (nextUrl) {
    const page = await githubRestPage<TResponse>(input.token, nextUrl);
    items.push(...input.pickItems(page.body));
    nextUrl = page.nextUrl;
  }

  return items;
}

async function postIssueComment(input: {
  body: string;
  owner: string;
  prNumber: number;
  repo: string;
  token: string;
}): Promise<void> {
  const response = await fetch(
    `https://api.github.com/repos/${input.owner}/${input.repo}/issues/${input.prNumber}/comments`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${input.token}`,
        "Content-Type": "application/json",
        "User-Agent": "k-msg-pr-watch",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({ body: input.body }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to post re-review comment (${response.status}): ${await response.text()}`,
    );
  }
}

async function loadState(filePath: string): Promise<WatchState> {
  try {
    return JSON.parse(await readFile(filePath, "utf8")) as WatchState;
  } catch {
    return {};
  }
}

async function saveState(filePath: string, state: WatchState): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

function normalizeBody(body: string | undefined): string | undefined {
  if (!body) return undefined;
  const singleLine = body.replace(/\s+/g, " ").trim();
  if (singleLine.length <= 140) return singleLine;
  return `${singleLine.slice(0, 137)}...`;
}

async function collectReviews(input: {
  owner: string;
  prNumber: number;
  repo: string;
  token: string;
}): Promise<{
  headRefName: string;
  headSha: string;
  prNumber: number;
  title: string;
  unresolvedReviews: ReviewThreadSummary[];
  url: string;
}> {
  const query = `
    query PullRequestReviewThreads(
      $owner: String!
      $repo: String!
      $number: Int!
      $after: String
    ) {
      repository(owner: $owner, name: $repo) {
        pullRequest(number: $number) {
          number
          title
          url
          headRefName
          headRefOid
          reviewThreads(first: 100, after: $after) {
            nodes {
              isResolved
              isOutdated
              path
              line
              comments(last: 1) {
                nodes {
                  body
                  url
                  author {
                    login
                  }
                }
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }
    }
  `;

  const unresolvedReviews: ReviewThreadSummary[] = [];
  let after: string | null = null;
  let metadata:
    | {
        headRefName: string;
        headSha: string;
        prNumber: number;
        title: string;
        url: string;
      }
    | undefined;

  do {
    const payload = await githubGraphql<GraphqlPullRequestResponse>(
      input.token,
      query,
      {
        after,
        number: input.prNumber,
        owner: input.owner,
        repo: input.repo,
      },
    );

    const pullRequest = payload.repository.pullRequest;
    if (!pullRequest) {
      throw new Error(
        `Pull request #${input.prNumber} not found in ${input.owner}/${input.repo}`,
      );
    }

    metadata = {
      headRefName: pullRequest.headRefName,
      headSha: pullRequest.headRefOid,
      prNumber: pullRequest.number,
      title: pullRequest.title,
      url: pullRequest.url,
    };

    for (const thread of pullRequest.reviewThreads.nodes) {
      if (thread.isResolved) continue;
      const lastComment = thread.comments.nodes.at(-1);
      unresolvedReviews.push({
        author: lastComment?.author?.login,
        body: normalizeBody(lastComment?.body),
        isOutdated: thread.isOutdated,
        line: thread.line ?? undefined,
        path: thread.path ?? undefined,
        url: lastComment?.url,
      });
    }

    after = pullRequest.reviewThreads.pageInfo.hasNextPage
      ? pullRequest.reviewThreads.pageInfo.endCursor
      : null;
  } while (after);

  if (!metadata) {
    throw new Error("Failed to load pull request metadata");
  }

  return {
    ...metadata,
    unresolvedReviews,
  };
}

function toCheckSummaryList(input: {
  checkRuns: NonNullable<CheckRunsResponse["check_runs"]>;
  statuses: NonNullable<CombinedStatusResponse["statuses"]>;
}): CheckSummary[] {
  const fromCheckRuns = input.checkRuns.map((checkRun) => ({
    conclusion: checkRun.conclusion,
    kind: "check-run" as const,
    name: checkRun.name,
    status: checkRun.status,
    url: checkRun.details_url ?? checkRun.html_url ?? undefined,
  }));

  const fromStatuses = input.statuses.map((status) => ({
    conclusion: undefined,
    kind: "status-context" as const,
    name: status.context,
    status: status.state,
    url: status.target_url ?? undefined,
  }));

  return [...fromCheckRuns, ...fromStatuses];
}

async function collectCheckRuns(input: {
  headSha: string;
  owner: string;
  repo: string;
  token: string;
}): Promise<NonNullable<CheckRunsResponse["check_runs"]>> {
  return await collectPaginatedItems<CheckRunsResponse, CheckRunItem>({
    token: input.token,
    url: `https://api.github.com/repos/${input.owner}/${input.repo}/commits/${input.headSha}/check-runs?per_page=100`,
    pickItems: (body) => body.check_runs ?? [],
  });
}

async function collectStatuses(input: {
  headSha: string;
  owner: string;
  repo: string;
  token: string;
}): Promise<NonNullable<CombinedStatusResponse["statuses"]>> {
  return await collectPaginatedItems<CombinedStatusResponse, StatusItem>({
    token: input.token,
    url: `https://api.github.com/repos/${input.owner}/${input.repo}/commits/${input.headSha}/status?per_page=100`,
    pickItems: (body) => body.statuses ?? [],
  });
}

async function collectSnapshot(input: {
  owner: string;
  prNumber: number;
  repo: string;
  token: string;
}): Promise<Snapshot> {
  const reviews = await collectReviews(input);
  const [checkRuns, statuses] = await Promise.all([
    collectCheckRuns({
      headSha: reviews.headSha,
      owner: input.owner,
      repo: input.repo,
      token: input.token,
    }),
    collectStatuses({
      headSha: reviews.headSha,
      owner: input.owner,
      repo: input.repo,
      token: input.token,
    }),
  ]);

  const checks = toCheckSummaryList({ checkRuns, statuses });

  return {
    ...reviews,
    failingChecks: checks.filter(isFailingCheck),
    pendingChecks: checks.filter(isPendingCheck),
  };
}

function isFailingCheck(check: CheckSummary): boolean {
  if (check.kind === "status-context") {
    return check.status === "error" || check.status === "failure";
  }

  if (check.status !== "completed") return false;
  return (
    check.conclusion === "failure" ||
    check.conclusion === "timed_out" ||
    check.conclusion === "cancelled" ||
    check.conclusion === "action_required" ||
    check.conclusion === "startup_failure" ||
    check.conclusion === "stale"
  );
}

function isPendingCheck(check: CheckSummary): boolean {
  if (check.kind === "status-context") {
    return check.status === "pending";
  }
  return check.status !== "completed";
}

function buildSnapshotKey(snapshot: Snapshot): string {
  return JSON.stringify({
    failingChecks: snapshot.failingChecks.map((entry) => [
      entry.kind,
      entry.name,
      entry.status,
      entry.conclusion ?? null,
    ]),
    headSha: snapshot.headSha,
    pendingChecks: snapshot.pendingChecks.map((entry) => [
      entry.kind,
      entry.name,
      entry.status,
      entry.conclusion ?? null,
    ]),
    unresolvedReviews: snapshot.unresolvedReviews.map((entry) => [
      entry.path ?? "",
      entry.line ?? 0,
      entry.isOutdated,
      entry.body ?? "",
    ]),
  });
}

function shortSha(value: string): string {
  return value.slice(0, 7);
}

function renderText(snapshot: Snapshot): string {
  const lines = [
    `[${new Date().toISOString()}] PR #${snapshot.prNumber} ${snapshot.title}`,
    `url: ${snapshot.url}`,
    `head: ${snapshot.headRefName} @ ${shortSha(snapshot.headSha)}`,
    `reviews: ${snapshot.unresolvedReviews.length} unresolved`,
    `checks: ${snapshot.failingChecks.length} failing, ${snapshot.pendingChecks.length} pending`,
  ];

  if (snapshot.unresolvedReviews.length > 0) {
    for (const review of snapshot.unresolvedReviews) {
      const location = review.path
        ? `${review.path}${review.line ? `:${review.line}` : ""}`
        : "unknown";
      lines.push(
        `- review ${location}${review.isOutdated ? " [outdated]" : ""}${
          review.author ? ` by ${review.author}` : ""
        }${review.body ? ` :: ${review.body}` : ""}`,
      );
    }
  }

  if (snapshot.failingChecks.length > 0) {
    for (const check of snapshot.failingChecks) {
      lines.push(
        `- failing ${check.kind} ${check.name} (${check.status}${check.conclusion ? `/${check.conclusion}` : ""})${check.url ? ` ${check.url}` : ""}`,
      );
    }
  }

  if (snapshot.pendingChecks.length > 0) {
    for (const check of snapshot.pendingChecks) {
      lines.push(
        `- pending ${check.kind} ${check.name} (${check.status})${check.url ? ` ${check.url}` : ""}`,
      );
    }
  }

  return lines.join("\n");
}

async function maybePostRereviewComment(input: {
  args: Args;
  owner: string;
  repo: string;
  snapshot: Snapshot;
  state: WatchState;
  token: string;
}): Promise<WatchState> {
  const { args, owner, repo, snapshot, state, token } = input;
  if (!args.postRereviewComment) return state;
  if (snapshot.unresolvedReviews.length === 0) return state;
  if (snapshot.failingChecks.length > 0 || snapshot.pendingChecks.length > 0) {
    return state;
  }
  if (state.lastCommentedHeadSha === snapshot.headSha) return state;

  const body =
    args.commentBody ??
    `Follow-up pushed on \`${shortSha(snapshot.headSha)}\` to address the current review feedback. Re-review requested when convenient.`;

  await postIssueComment({
    body,
    owner,
    prNumber: snapshot.prNumber,
    repo,
    token,
  });

  return {
    ...state,
    lastCommentedHeadSha: snapshot.headSha,
  };
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const token = getGithubToken();
  const { owner, repo } = resolveRepository(args);
  const intervalMs = args.intervalMinutes * 60 * 1000;
  let state = await loadState(args.stateFile);

  for (;;) {
    const snapshot = await collectSnapshot({
      owner,
      prNumber: args.prNumber,
      repo,
      token,
    });
    const snapshotKey = buildSnapshotKey(snapshot);
    const changed = snapshotKey !== state.lastSnapshotKey;

    if (args.json) {
      console.log(
        JSON.stringify(
          {
            changed,
            snapshot,
          },
          null,
          2,
        ),
      );
    } else if (changed || args.once) {
      console.log(renderText(snapshot));
    } else {
      console.log(
        `[${new Date().toISOString()}] no change for PR #${snapshot.prNumber} (${shortSha(snapshot.headSha)})`,
      );
    }

    state = await maybePostRereviewComment({
      args,
      owner,
      repo,
      snapshot,
      state,
      token,
    });
    state.lastSnapshotKey = snapshotKey;
    await saveState(args.stateFile, state);

    if (args.once) return;
    await sleep(intervalMs);
  }
}

await main();
