import { useEffect, useState } from 'react';
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
  const [syncMessage, setSyncMessage] = useState('');
  const validFavorites = favorites.filter((id) => items.some((item) => item.id === id));

  useEffect(() => {
    function syncFavorites(event: StorageEvent) {
      if (event.key !== key && event.key !== null) return;
      if (event.newValue === null) {
        setFavorites([]);
        setSavedLocally(true);
        setSyncMessage('Favorites cleared from another tab.');
        return;
      }
      try {
        const stored: unknown = JSON.parse(event.newValue);
        if (!Array.isArray(stored)) throw new Error('Invalid favorites');
        const next = [
          ...new Set(
            stored.filter(
              (id): id is string => typeof id === 'string' && items.some((item) => item.id === id),
            ),
          ),
        ];
        setFavorites(next);
        setSavedLocally(true);
        setSyncMessage(
          next.length
            ? 'Favorites updated from another tab.'
            : 'Favorites cleared from another tab.',
        );
      } catch {
        setSyncMessage(
          'Invalid favorites data from another tab was ignored. These favorites were kept.',
        );
      }
    }

    window.addEventListener('storage', syncFavorites);
    return () => window.removeEventListener('storage', syncFavorites);
  }, [items]);

  function toggleFavorite(id: string) {
    const next = validFavorites.includes(id)
      ? validFavorites.filter((value) => value !== id)
      : [...validFavorites, id];
    setFavorites(next);
    setSyncMessage('');
    try {
      localStorage.setItem(key, JSON.stringify(next));
      setSavedLocally(true);
    } catch {
      setSavedLocally(false);
    }
  }

  return { favorites: validFavorites, toggleFavorite, savedLocally, syncMessage };
}
