import { useState } from 'react';
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

  function importCollection(collection: Collection) {
    let savedLocally = true;
    try {
      localStorage.setItem(key, JSON.stringify(collection));
    } catch {
      savedLocally = false;
    }
    setState({ collection, source: 'imported', savedLocally });
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
    return savedLocally;
  }

  return { ...state, importCollection, resetCollection };
}
