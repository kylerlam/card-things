import { useEffect, useRef, useState } from 'react';
import { collection } from './collection';

const key = 'cardthings:favorites:v1';

function parseFavorites(value: string | null): string[] {
  try {
    const stored: unknown = JSON.parse(value || '[]');
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

function readFavorites() {
  try {
    return {
      favorites: parseFavorites(localStorage.getItem(key)),
      savedLocally: true,
    };
  } catch {
    return { favorites: [] as string[], savedLocally: false };
  }
}

export function useFavorites() {
  const [state, setState] = useState(readFavorites);
  const latestState = useRef(state);

  function updateState(next: typeof state) {
    latestState.current = next;
    setState(next);
  }

  useEffect(() => {
    function syncFavorites(event: StorageEvent) {
      if ((event.key !== key && event.key !== null) || event.storageArea !== localStorage) return;
      // A failed write leaves per-visit favorites that another tab must not erase.
      if (latestState.current.savedLocally) updateState(readFavorites());
    }
    window.addEventListener('storage', syncFavorites);
    return () => window.removeEventListener('storage', syncFavorites);
  }, []);

  function latestFavorites() {
    const current = latestState.current;
    const stored = current.savedLocally ? readFavorites() : current;
    return stored.savedLocally ? stored.favorites : current.favorites;
  }

  function saveFavorites(next: string[]) {
    try {
      localStorage.setItem(key, JSON.stringify(next));
      updateState({ favorites: next, savedLocally: true });
    } catch {
      updateState({ favorites: next, savedLocally: false });
    }
  }

  function toggleFavorite(id: string) {
    const current = latestFavorites();
    saveFavorites(
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  }

  function importFavorites(ids: string[]) {
    saveFavorites([...new Set([...latestFavorites(), ...ids])]);
  }

  return { ...state, toggleFavorite, importFavorites };
}
