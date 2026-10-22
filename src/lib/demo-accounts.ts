export const demoAccounts = [
  {
    login: "cardthings",
    email: "cardthings@example.test",
    name: "cardthings",
    role: "user",
  },
  {
    login: "cardthings_admin",
    email: "cardthings_admin@example.test",
    name: "cardthings_admin",
    role: "admin",
  },
] as const;

export function resolveLoginEmail(value: string) {
  const login = value.trim().toLowerCase();
  return demoAccounts.find((account) => account.login === login)?.email ?? login;
}
