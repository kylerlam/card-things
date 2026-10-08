import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { parseCollection } from '../src/lib/validateCollection.ts';

const source =
  process.argv[2] || fileURLToPath(new URL('../src/content/collection.json', import.meta.url));
const publicDirectory = fileURLToPath(new URL('../public/', import.meta.url));

try {
  const collection = parseCollection(JSON.parse(readFileSync(source, 'utf8')));
  const missing = [...new Set(collection.items.map((item) => item.image.src))].filter((image) => {
    try {
      return !statSync(resolve(publicDirectory, image)).isFile();
    } catch {
      return true;
    }
  });
  if (missing.length)
    throw new Error(
      `Missing collection images:\n${missing.map((image) => `- public/${image}`).join('\n')}`,
    );
  console.log(
    `Collection valid: ${collection.items.length} items, ${collection.categories.length} categories.`,
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Collection validation failed.');
  process.exitCode = 1;
}
