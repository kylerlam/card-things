import type { Collection } from './types';

const checks = new Map<string, Promise<boolean>>();
const timeoutMilliseconds = 10_000;

export function collectionImageUrl(src: string) {
  return `${import.meta.env.BASE_URL}${src}`;
}

export function canLoadCollectionImage(src: string) {
  const existing = checks.get(src);
  if (existing) return existing;

  const check = new Promise<boolean>((resolve) => {
    const image = new Image();
    const timeout = window.setTimeout(() => settle(false), timeoutMilliseconds);
    const settle = (available: boolean) => {
      window.clearTimeout(timeout);
      image.onload = null;
      image.onerror = null;
      resolve(available);
    };
    image.onload = () => settle(true);
    image.onerror = () => settle(false);
    image.src = collectionImageUrl(src);
  });
  checks.set(src, check);
  return check;
}

export async function unavailableCollectionImages(collection: Collection) {
  const paths = [...new Set(collection.items.map((item) => item.image.src))];
  const results = new Map(
    await Promise.all(
      paths.map(async (path) => [path, await canLoadCollectionImage(path)] as const),
    ),
  );
  return collection.items.flatMap((item, index) =>
    results.get(item.image.src)
      ? []
      : [
          `items[${index}].image.src: could not load public/${item.image.src} as an image from this site`,
        ],
  );
}
