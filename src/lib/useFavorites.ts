import { useState } from 'react';
import { collection } from './collection';

const key = 'cardthings:favorites:v1';

function readFavorites(): string[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(stored)
      ? [
          ...new Set(
            stored.filter(
              (id): id is string =>
                typeof id === 'string' && collection.items.some((item) => item.id === id),
            ),
          ),
        ]
      : [];
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState(readFavorites);
  const [savedLocally, setSavedLocally] = useState(true);

  function toggleFavorite(id: string) {
    const next = favorites.includes(id)
      ? favorites.filter((value) => value !== id)
      : [...favorites, id];
    setFavorites(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
      setSavedLocally(true);
    } catch {
      setSavedLocally(false);
    }
  }

  return { favorites, toggleFavorite, savedLocally };
}
