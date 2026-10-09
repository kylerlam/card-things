import { useEffect, useState } from 'react';
import type { CollectionItem } from './types';

const key = 'cardthings:favorites:v1';

interface FavoritesState {
  favorites: string[];
  savedLocally: boolean;
  loadMessage: string;
}

function readFavorites(items: CollectionItem[]): FavoritesState {
  let stored: string | null;
  try {
    stored = localStorage.getItem(key);
  } catch {
    return {
      favorites: [],
      savedLocally: false,
      loadMessage: 'Browser favorites could not be read. No favorites are shown for this visit.',
    };
  }
  if (!stored) return { favorites: [], savedLocally: true, loadMessage: '' };
  try {
    const value: unknown = JSON.parse(stored);
    if (!Array.isArray(value)) throw new Error('Invalid favorites');
    return {
      favorites: [
        ...new Set(
          value.filter(
            (id): id is string => typeof id === 'string' && items.some((item) => item.id === id),
          ),
        ),
      ],
      savedLocally: true,
      loadMessage: '',
    };
  } catch {
    return {
      favorites: [],
      savedLocally: true,
      loadMessage:
        'Saved favorites could not be read and were left unchanged. No favorites are shown.',
    };
  }
}

export function useFavorites(items: CollectionItem[]) {
  const [state, setState] = useState(() => readFavorites(items));
  const [syncMessage, setSyncMessage] = useState('');
  const validFavorites = state.favorites.filter((id) => items.some((item) => item.id === id));

  useEffect(() => {
    function syncFavorites(event: StorageEvent) {
      if (event.key !== key && event.key !== null) return;
      if (event.newValue === null) {
        setState({ favorites: [], savedLocally: true, loadMessage: '' });
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
        setState({ favorites: next, savedLocally: true, loadMessage: '' });
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
    setSyncMessage('');
    try {
      localStorage.setItem(key, JSON.stringify(next));
      setState({ favorites: next, savedLocally: true, loadMessage: '' });
    } catch {
      setState({ favorites: next, savedLocally: false, loadMessage: '' });
    }
  }

  return {
    favorites: validFavorites,
    toggleFavorite,
    savedLocally: state.savedLocally,
    syncMessage,
    loadMessage: state.loadMessage,
  };
}
