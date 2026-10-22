import { afterEach, expect, test, vi } from "vitest";

import { hasSameOrigin } from "../src/lib/request-origin";

afterEach(() => vi.unstubAllEnvs());

test("mutations require the configured public origin even behind a container proxy", () => {
  vi.stubEnv("BETTER_AUTH_URL", "https://cards.example.com");
  const request = (origin?: string) => new Request("http://0.0.0.0:3000/api/account/avatar", { headers: origin ? { Origin: origin } : {} });
  expect(hasSameOrigin(request("https://cards.example.com"))).toBe(true);
  for (const value of [undefined, "null", "https://other.example.com", "http://cards.example.com"]) {
    expect(hasSameOrigin(request(value))).toBe(false);
  }
});
