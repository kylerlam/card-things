import { useState } from 'react';
import type { CollectionItem } from './types';

const key = 'cardthings:favorites:v1';

function readFavorites(items: CollectionItem[]): string[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(stored)
      ? [
          ...new Set(
            stored.filter(
              (id): id is string => typeof id === 'string' && items.some((item) => item.id === id),
            ),
          ),
        ]
      : [];
  } catch {
    return [];
  }
}

export function useFavorites(items: CollectionItem[]) {
  const [favorites, setFavorites] = useState(() => readFavorites(items));
  const [savedLocally, setSavedLocally] = useState(true);
  const validFavorites = favorites.filter((id) => items.some((item) => item.id === id));

  function toggleFavorite(id: string) {
    const next = validFavorites.includes(id)
      ? validFavorites.filter((value) => value !== id)
      : [...validFavorites, id];
    setFavorites(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
      setSavedLocally(true);
    } catch {
      setSavedLocally(false);
    }
  }

  return { favorites: validFavorites, toggleFavorite, savedLocally };
}
