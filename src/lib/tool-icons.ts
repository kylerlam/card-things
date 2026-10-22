const githubApi = "https://api.github.com/repos/";
const maximumMetadataBytes = 128 * 1024;

function httpsUrl(value: unknown, base?: string) {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value, base);
    return url.protocol === "https:" && !url.username && !url.password ? url : null;
  } catch {
    return null;
  }
}

export function websiteIconSources(value: unknown) {
  const url = httpsUrl(value);
  return url ? [new URL("/favicon.ico", url).href] : [];
}

export function githubRepository(value: string) {
  const url = httpsUrl(value);
  if (!url || !["github.com", "www.github.com"].includes(url.hostname)) return null;
  const [owner, name] = url.pathname.split("/").filter(Boolean);
  if (!owner || !name || !/^[a-z\d-]+$/i.test(owner) || !/^[a-z\d_.-]+$/i.test(name)) return null;
  return `${owner}/${name.replace(/\.git$/, "")}`;
}

async function githubMetadata(path: string, fetcher: typeof fetch) {
  try {
    // Only this fixed API host is fetched by the server; image URLs load in the browser.
    const response = await fetcher(githubApi + path, {
      headers: { Accept: "application/vnd.github+json" },
      redirect: "error",
      signal: AbortSignal.timeout(3000),
      next: { revalidate: 86400 },
    });
    if (!response.ok || !response.body) return null;
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let size = 0;
    let text = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maximumMetadataBytes) {
        await reader.cancel();
        return null;
      }
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function readmeLogo(content: unknown, base: string) {
  if (typeof content !== "string") return null;
  for (const tag of content.match(/<img\b[^>]*>/gi) ?? []) {
    const alt = tag.match(/\balt\s*=\s*["']([^"']*)["']/i)?.[1];
    const src = tag.match(/\bsrc\s*=\s*["']([^"']*)["']/i)?.[1];
    if (alt && /\b(logo|icon)\b/i.test(alt)) {
      const url = httpsUrl(src?.replaceAll("&amp;", "&"), base);
      if (url) return url.href;
    }
  }
  const markdown = content.match(/!\[[^\]]*\b(?:logo|icon)\b[^\]]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)/i);
  return httpsUrl(markdown?.[1], base)?.href ?? null;
}

export async function resolveToolIconSources(value: string, fetcher: typeof fetch = fetch) {
  const repository = githubRepository(value);
  if (!repository) return websiteIconSources(value);
  const [details, readme] = await Promise.all([
    githubMetadata(repository, fetcher),
    githubMetadata(repository + "/readme", fetcher),
  ]);
  let logo: string | null = null;
  if (typeof readme?.content === "string") {
    try {
      const bytes = Uint8Array.from(atob(readme.content), (character) => character.charCodeAt(0));
      logo = readmeLogo(new TextDecoder().decode(bytes), `https://raw.githubusercontent.com/${repository}/HEAD/`);
    } catch {
      // An unavailable README must not prevent the official website favicon fallback.
    }
  }
  return [...new Set([...(logo ? [logo] : []), ...websiteIconSources(details?.homepage)])];
}
