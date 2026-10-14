import { describe, expect, it } from "vitest";

import { createPublicId } from "../src/lib/public-id";

describe("public user ids", () => {
  it("uses the ct prefix with twelve lowercase alphanumeric characters", () => {
    const values = Array.from({ length: 100 }, createPublicId);

    expect(new Set(values).size).toBe(values.length);
    values.forEach((value) => expect(value).toMatch(/^ct[a-z0-9]{12}$/));
  });
});
