export function createFavoriteBackup(favorites: string[]) {
  return JSON.stringify({ version: 1, favorites: [...new Set(favorites)] }, null, 2);
}

export function parseFavoriteBackup(text: string, knownIds: string[]): string[] {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Choose a valid JSON favorites backup.');
  }
  if (!data || typeof data !== 'object' || Array.isArray(data))
    throw new Error('This file is not a favorites backup.');
  const backup = data as Record<string, unknown>;
  if (backup.version !== 1) throw new Error('This favorites backup version is not supported.');
  if (!Array.isArray(backup.favorites) || !backup.favorites.every((id) => typeof id === 'string'))
    throw new Error('The backup must contain a list of favorite item IDs.');
  const known = new Set(knownIds);
  return [...new Set(backup.favorites.filter((id: string) => known.has(id)))];
}
