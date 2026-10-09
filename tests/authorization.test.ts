import { describe, expect, it } from "vitest";

import { hasAdminRole } from "../src/lib/authorization";

describe("admin authorization", () => {
  it("rejects missing and ordinary-user sessions", () => {
    expect(hasAdminRole(null)).toBe(false);
    expect(hasAdminRole({ user: { role: "user" } })).toBe(false);
    expect(hasAdminRole({ user: { role: undefined } })).toBe(false);
  });

  it("accepts only an explicit admin role", () => {
    expect(hasAdminRole({ user: { role: "admin" } })).toBe(true);
  });
});
