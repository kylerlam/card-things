import { describe, expect, it } from "vitest";

import { isCardImageUrl } from "../src/lib/card-image-url";

describe("card image URLs", () => {
  it("accepts administrator-selected web images and same-site images", () => {
    for (const value of ["https://images.example.test/cover.png", "http://127.0.0.1:3311/images/cover.svg", "/images/cover.png", "/images/book%20cover.webp"]) {
      expect(isCardImageUrl(value), value).toBe(true);
    }
  });

  it("rejects non-web schemes, credentials, ambiguous hosts, and malformed values", () => {
    for (const value of ["", "cover.png", "//images.example.test/cover.png", "/\\images.example.test/cover.png", "https://user:password@images.example.test/cover.png", "javascript:alert(1)", "data:image/png;base64,abc", "file:///tmp/cover.png", "/images/book cover.png", `https://example.test/${"x".repeat(2048)}`]) {
      expect(isCardImageUrl(value), value).toBe(false);
    }
  });
});
