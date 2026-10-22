export function hasSameOrigin(request: Request) {
  const expected = new URL(process.env.BETTER_AUTH_URL || request.url).origin;
  return request.headers.get("origin") === expected;
}
