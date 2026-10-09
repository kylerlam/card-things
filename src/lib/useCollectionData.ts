import { useEffect, useState } from 'react';
import { bundledCollection } from './collection';
import type { Collection } from './types';
import { parseCollection } from './validateCollection';

const key = 'cardthings:collection:v1';

interface CollectionState {
  collection: Collection;
  source: 'bundled' | 'imported';
  savedLocally: boolean;
}

function readCollection(): CollectionState {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return { collection: bundledCollection, source: 'bundled', savedLocally: true };
    return {
      collection: parseCollection(JSON.parse(stored)),
      source: 'imported',
      savedLocally: true,
    };
  } catch {
    return { collection: bundledCollection, source: 'bundled', savedLocally: true };
  }
}

export function useCollectionData() {
  const [state, setState] = useState(readCollection);
  const [syncMessage, setSyncMessage] = useState('');

  useEffect(() => {
    function syncCollection(event: StorageEvent) {
      if (event.key !== key && event.key !== null) return;
      if (event.newValue === null) {
        setState({ collection: bundledCollection, source: 'bundled', savedLocally: true });
        setSyncMessage('Bundled collection restored from another tab.');
        return;
      }
      try {
        const collection = parseCollection(JSON.parse(event.newValue));
        setState({ collection, source: 'imported', savedLocally: true });
        setSyncMessage('Collection updated from another tab.');
      } catch {
        setSyncMessage(
          'Invalid collection data from another tab was ignored. This collection was kept.',
        );
      }
    }

    window.addEventListener('storage', syncCollection);
    return () => window.removeEventListener('storage', syncCollection);
  }, []);

  function importCollection(collection: Collection) {
    let savedLocally = true;
    try {
      localStorage.setItem(key, JSON.stringify(collection));
    } catch {
      savedLocally = false;
    }
    setState({ collection, source: 'imported', savedLocally });
    setSyncMessage('');
    return savedLocally;
  }

  function resetCollection() {
    let savedLocally = true;
    try {
      localStorage.removeItem(key);
    } catch {
      savedLocally = false;
    }
    setState({ collection: bundledCollection, source: 'bundled', savedLocally });
    setSyncMessage('');
    return savedLocally;
  }

  return { ...state, importCollection, resetCollection, syncMessage };
}
