import { describe, expect, it, vi } from "vitest";

import { githubRepository, readmeLogo, resolveToolIconSources, websiteIconSources } from "../src/lib/tool-icons";

function jsonResponse(value: unknown) {
  return new Response(JSON.stringify(value), { headers: { "Content-Type": "application/json" } });
}

describe("official application icons", () => {
  it("uses website favicons and rejects non-HTTPS or credential URLs", () => {
    expect(websiteIconSources("https://www.snipaste.com/download.html")).toEqual(["https://www.snipaste.com/favicon.ico"]);
    expect(websiteIconSources("javascript:alert(1)")).toEqual([]);
    expect(websiteIconSources("http://localhost/")).toEqual([]);
    expect(websiteIconSources("https://user:password@example.com/")).toEqual([]);
  });

  it("recognizes validated GitHub repositories only", () => {
    expect(githubRepository("https://github.com/p0deje/Maccy")).toBe("p0deje/Maccy");
    expect(githubRepository("https://github.com/localsend/localsend/releases")).toBe("localsend/localsend");
    expect(githubRepository("https://github.com.evil.test/owner/repo")).toBeNull();
    expect(githubRepository("https://github.com/owner/%2e%2e")).toBeNull();
  });

  it("selects README logos instead of screenshots or contributor portraits", () => {
    expect(readmeLogo('<img src="screen.png" alt="screenshot"><img src="logo.png" alt="Logo">', "https://raw.githubusercontent.com/owner/repo/HEAD/")).toBe("https://raw.githubusercontent.com/owner/repo/HEAD/logo.png");
    expect(readmeLogo("![App icon](assets/icon.png)", "https://raw.githubusercontent.com/owner/repo/HEAD/")).toBe("https://raw.githubusercontent.com/owner/repo/HEAD/assets/icon.png");
    expect(readmeLogo('<img src="https://avatars.githubusercontent.com/person" alt="Contributor">', "https://example.com/")).toBeNull();
  });

  it("resolves Maccy's README logo and its official homepage without server-fetching image URLs", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ homepage: "https://maccy.app" }))
      .mockResolvedValueOnce(jsonResponse({ content: btoa('<img src="https://maccy.app/img/maccy/Logo.png" alt="Logo">') }));
    expect(await resolveToolIconSources("https://github.com/p0deje/Maccy", fetcher)).toEqual([
      "https://maccy.app/img/maccy/Logo.png", "https://maccy.app/favicon.ico",
    ]);
    expect(fetcher.mock.calls.map(([url]) => url)).toEqual([
      "https://api.github.com/repos/p0deje/Maccy", "https://api.github.com/repos/p0deje/Maccy/readme",
    ]);
    expect(fetcher.mock.calls.every(([, options]) => options?.redirect === "error")).toBe(true);
  });

  it("uses LocalSend's official homepage favicon when its README has no app logo", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ homepage: "https://localsend.org" }))
      .mockResolvedValueOnce(jsonResponse({ content: btoa('<img src="screen.webp" alt="PC screenshot">') }));
    expect(await resolveToolIconSources("https://github.com/localsend/localsend", fetcher)).toEqual(["https://localsend.org/favicon.ico"]);
  });

  it("does not fetch arbitrary website URLs from the server", async () => {
    const fetcher = vi.fn<typeof fetch>();
    expect(await resolveToolIconSources("https://www.snipaste.com/", fetcher)).toEqual(["https://www.snipaste.com/favicon.ico"]);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("falls back safely for unavailable or oversized GitHub metadata", async () => {
    const unavailable = vi.fn<typeof fetch>().mockRejectedValue(new Error("unavailable"));
    expect(await resolveToolIconSources("https://github.com/owner/repo", unavailable)).toEqual([]);
    const oversized = vi.fn<typeof fetch>().mockResolvedValue(new Response("x".repeat(128 * 1024 + 1)));
    expect(await resolveToolIconSources("https://github.com/owner/repo", oversized)).toEqual([]);
  });
});
