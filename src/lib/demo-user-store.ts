"use client";

import { useSyncExternalStore } from "react";

export type DemoFavorite = {
  slug: string;
  name: string;
  summary: string;
};

export type DemoCustomTool = {
  id: string;
  name: string;
  note: string;
};

export type DemoUserState = {
  version: 1;
  signedIn: boolean;
  entry: "auth" | "demo";
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  favorites: DemoFavorite[];
  customTools: DemoCustomTool[];
};

const storageKey = "cardthings-demo-user-v1";
const listeners = new Set<() => void>();

const initialState: DemoUserState = {
  version: 1,
  signedIn: false,
  entry: "auth",
  id: "CT-DEMO-0001",
  name: "示例用戶",
  email: "demo@example.test",
  avatar: null,
  favorites: [],
  customTools: [],
};

let state = initialState;
let loaded = false;

function loadState() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;

  try {
    const stored = window.sessionStorage.getItem(storageKey);
    if (!stored) return;
    const parsed = JSON.parse(stored) as Partial<DemoUserState>;
    state = {
      ...initialState,
      ...parsed,
      version: 1,
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
      customTools: Array.isArray(parsed.customTools) ? parsed.customTools : [],
    };
  } catch {
    state = initialState;
  }
}

function subscribe(listener: () => void) {
  loadState();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  loadState();
  return state;
}

function getServerSnapshot() {
  return initialState;
}

function save(next: DemoUserState) {
  state = next;
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(storageKey, JSON.stringify(next));
  }
  listeners.forEach((listener) => listener());
}

export function useDemoUser() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function signInDemoUser(profile?: {
  name?: string;
  email?: string;
  id?: string;
  entry?: "auth" | "demo";
}) {
  loadState();
  save({
    ...state,
    signedIn: true,
    entry: profile?.entry ?? "auth",
    id: profile?.id ?? state.id,
    name: profile?.name?.trim() || state.name,
    email: profile?.email?.trim() || state.email,
  });
}

export function signOutDemoUser() {
  loadState();
  save({ ...state, signedIn: false });
}

export function resetDemoUser() {
  save({ ...initialState });
}

export function toggleDemoFavorite(favorite: DemoFavorite) {
  loadState();
  const exists = state.favorites.some((item) => item.slug === favorite.slug);
  save({
    ...state,
    favorites: exists
      ? state.favorites.filter((item) => item.slug !== favorite.slug)
      : [...state.favorites, favorite],
  });
}

export function addDemoCustomTool(name: string, note: string) {
  loadState();
  save({
    ...state,
    customTools: [
      ...state.customTools,
      { id: crypto.randomUUID(), name: name.trim(), note: note.trim() },
    ],
  });
}

export function removeDemoCustomTool(id: string) {
  loadState();
  save({
    ...state,
    customTools: state.customTools.filter((item) => item.id !== id),
  });
}

export function updateDemoProfile(profile: {
  name: string;
  email: string;
  avatar?: string | null;
}) {
  loadState();
  save({
    ...state,
    name: profile.name.trim(),
    email: profile.email.trim(),
    avatar: profile.avatar === undefined ? state.avatar : profile.avatar,
  });
}
