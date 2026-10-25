import { beforeEach, describe, expect, it, vi } from "vitest";

import catalogue from "../deployments/local-preview/catalogue.json";
import { GET } from "../src/app/api/tool-icon/route";

const { resolveSources } = vi.hoisted(() => ({ resolveSources: vi.fn() }));

vi.mock("@/lib/tool-icons", () => ({ resolveToolIconSources: resolveSources }));

function request(url: string) {
  return new Request(`https://cardthings.test/api/tool-icon?url=${encodeURIComponent(url)}`);
}

describe("configured official icons", () => {
  beforeEach(() => {
    resolveSources.mockReset();
  });

  it("serves configured app icons without depending on GitHub metadata", async () => {
    resolveSources.mockRejectedValue(new Error("GitHub unavailable"));
    const configured = catalogue.cards.filter((card) => card.iconUrl);
    expect(configured.length).toBeGreaterThan(0);
    for (const card of configured) {
      const response = await GET(request(card.officialUrl));
      expect(await response.json()).toEqual({ sources: [card.iconUrl] });
    }
    expect(resolveSources).not.toHaveBeenCalled();
  });

  it("keeps the existing resolver for unconfigured cards", async () => {
    resolveSources.mockResolvedValue(["https://example.test/favicon.ico"]);
    const response = await GET(request("https://example.test/"));
    expect(await response.json()).toEqual({ sources: ["https://example.test/favicon.ico"] });
    expect(resolveSources).toHaveBeenCalledWith("https://example.test/");
  });

  it("rejects oversized URLs before resolving them", async () => {
    const response = await GET(request(`https://example.test/${"x".repeat(2048)}`));
    expect(await response.json()).toEqual({ sources: [] });
    expect(resolveSources).not.toHaveBeenCalled();
  });
});
