import { describe, expect, it, vi } from "vitest";

import { githubRepository, readmeLogo, resolveToolIconSources, websiteIconSources } from "../src/lib/tool-icons";

function jsonResponse(value: unknown) {
  return new Response(JSON.stringify(value), { headers: { "Content-Type": "application/json" } });
}

describe("official application icons", () => {
  it("uses website favicons and rejects non-HTTPS or credential URLs", () => {
    expect(websiteIconSources("https://catalogue.example.test/download.html")).toEqual(["https://catalogue.example.test/favicon.ico"]);
    expect(websiteIconSources("javascript:alert(1)")).toEqual([]);
    expect(websiteIconSources("http://localhost/")).toEqual([]);
    expect(websiteIconSources("https://user:password@example.com/")).toEqual([]);
  });

  it("recognizes validated GitHub repositories only", () => {
    expect(githubRepository("https://github.com/example/Collection")).toBe("example/Collection");
    expect(githubRepository("https://github.com/example/Bookmarks/releases")).toBe("example/Bookmarks");
    expect(githubRepository("https://github.com.evil.test/owner/repo")).toBeNull();
    expect(githubRepository("https://github.com/owner/%2e%2e")).toBeNull();
  });

  it("selects README logos instead of screenshots or contributor portraits", () => {
    expect(readmeLogo('<img src="screen.png" alt="screenshot"><img src="logo.png" alt="Logo">', "https://raw.githubusercontent.com/owner/repo/HEAD/")).toBe("https://raw.githubusercontent.com/owner/repo/HEAD/logo.png");
    expect(readmeLogo("![App icon](assets/icon.png)", "https://raw.githubusercontent.com/owner/repo/HEAD/")).toBe("https://raw.githubusercontent.com/owner/repo/HEAD/assets/icon.png");
    expect(readmeLogo('<img src="https://avatars.githubusercontent.com/person" alt="Contributor">', "https://example.com/")).toBeNull();
  });

  it("resolves Collection's README logo and its official homepage without server-fetching image URLs", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ homepage: "https://collection.example.test" }))
      .mockResolvedValueOnce(jsonResponse({ content: btoa('<img src="https://collection.example.test/assets/logo.png" alt="Logo">') }));
    expect(await resolveToolIconSources("https://github.com/example/Collection", fetcher)).toEqual([
      "https://collection.example.test/assets/logo.png", "https://collection.example.test/favicon.ico",
    ]);
    expect(fetcher.mock.calls.map(([url]) => url)).toEqual([
      "https://api.github.com/repos/example/Collection", "https://api.github.com/repos/example/Collection/readme",
    ]);
    expect(fetcher.mock.calls.every(([, options]) => options?.redirect === "error")).toBe(true);
  });

  it("uses Bookmarks's official homepage favicon when its README has no app logo", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ homepage: "https://bookmarks.example.test" }))
      .mockResolvedValueOnce(jsonResponse({ content: btoa('<img src="screen.webp" alt="PC screenshot">') }));
    expect(await resolveToolIconSources("https://github.com/example/Bookmarks", fetcher)).toEqual(["https://bookmarks.example.test/favicon.ico"]);
  });

  it("does not fetch arbitrary website URLs from the server", async () => {
    const fetcher = vi.fn<typeof fetch>();
    expect(await resolveToolIconSources("https://catalogue.example.test/", fetcher)).toEqual(["https://catalogue.example.test/favicon.ico"]);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("falls back safely for unavailable or oversized GitHub metadata", async () => {
    const unavailable = vi.fn<typeof fetch>().mockRejectedValue(new Error("unavailable"));
    expect(await resolveToolIconSources("https://github.com/owner/repo", unavailable)).toEqual([]);
    const oversized = vi.fn<typeof fetch>().mockResolvedValue(new Response("x".repeat(128 * 1024 + 1)));
    expect(await resolveToolIconSources("https://github.com/owner/repo", oversized)).toEqual([]);
  });
});
