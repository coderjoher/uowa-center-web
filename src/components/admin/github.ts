/**
 * Thin client for the GitHub Contents API, called straight from the editor's
 * browser with a fine-grained personal access token that has "Contents:
 * read and write" on this repository. Nothing here touches a server of ours:
 * a save is a commit to `master`, and the existing Wasmer deploy publishes
 * it a few minutes later.
 */
export const REPO = { owner: "coderjoher", repo: "uowa-center-web", branch: "master" };
const API = "https://api.github.com";

export interface RepoFile {
  path: string;
  sha: string;
  text: string;
}

export class GitHubError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

function headers(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function request<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, { ...init, headers: { ...headers(token), ...(init?.headers ?? {}) } });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      detail = ((await res.json()) as { message?: string }).message ?? detail;
    } catch {}
    throw new GitHubError(detail, res.status);
  }
  return (await res.json()) as T;
}

/* UTF-8 safe base64 in both directions. */
function encode(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}
function decode(b64: string): string {
  const bin = atob(b64.replace(/\n/g, ""));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Confirms the token can push to the repository; returns the login. */
export async function verifyToken(token: string): Promise<string> {
  const repo = await request<{ permissions?: { push?: boolean } }>(
    token,
    `/repos/${REPO.owner}/${REPO.repo}`,
  );
  if (!repo.permissions?.push) throw new GitHubError("الرمز لا يملك صلاحية الكتابة على المستودع", 403);
  const me = await request<{ login: string }>(token, "/user");
  return me.login;
}

export async function readFile(token: string, path: string): Promise<RepoFile> {
  const file = await request<{ sha: string; content: string; encoding: string }>(
    token,
    `/repos/${REPO.owner}/${REPO.repo}/contents/${path}?ref=${REPO.branch}`,
  );
  return { path, sha: file.sha, text: decode(file.content) };
}

/** Writes text; returns the new blob sha to use on the next write. */
export async function writeFile(
  token: string,
  path: string,
  text: string,
  message: string,
  sha?: string,
): Promise<string> {
  const out = await request<{ content: { sha: string } }>(
    token,
    `/repos/${REPO.owner}/${REPO.repo}/contents/${path}`,
    {
      method: "PUT",
      body: JSON.stringify({ message, content: encode(text), branch: REPO.branch, sha }),
    },
  );
  return out.content.sha;
}

/** Uploads a binary (already base64) — used for images. */
export async function writeBinary(
  token: string,
  path: string,
  base64: string,
  message: string,
): Promise<void> {
  await request(token, `/repos/${REPO.owner}/${REPO.repo}/contents/${path}`, {
    method: "PUT",
    body: JSON.stringify({ message, content: base64, branch: REPO.branch }),
  });
}

export async function listDir(token: string, path: string): Promise<string[]> {
  try {
    const items = await request<{ name: string; type: string }[]>(
      token,
      `/repos/${REPO.owner}/${REPO.repo}/contents/${path}?ref=${REPO.branch}`,
    );
    return items.filter((i) => i.type === "file").map((i) => i.name);
  } catch (e) {
    if (e instanceof GitHubError && e.status === 404) return [];
    throw e;
  }
}
