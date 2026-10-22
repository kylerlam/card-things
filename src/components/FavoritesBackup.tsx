import { useRef, useState } from 'react';
import { collection } from '../lib/collection';
import { createFavoriteBackup, parseFavoriteBackup } from '../lib/favoriteBackup';

export function FavoritesBackup({
  favorites,
  onImport,
}: {
  favorites: string[];
  onImport: (ids: string[]) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState('');

  function download() {
    const url = URL.createObjectURL(
      new Blob([createFavoriteBackup(favorites)], { type: 'application/json' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cardthings-favorites.json';
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice(
      `Exported ${favorites.length} favorite${favorites.length === 1 ? '' : 's'} to a local JSON file.`,
    );
  }

  return (
    <section className="favorites-backup" aria-label="Favorites backup">
      <div className="dialog-actions">
        <button className="secondary-button" onClick={download}>
          Export favorites
        </button>
        <button className="secondary-button" onClick={() => input.current?.click()}>
          Import favorites
        </button>
        <input
          ref={input}
          type="file"
          accept=".json,application/json"
          aria-label="Favorites backup file"
          hidden
          onChange={async (event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = '';
            if (!file) return;
            if (file.size > 1024 * 1024) {
              setNotice('Choose a favorites backup of 1 MB or smaller.');
              return;
            }
            try {
              const ids = parseFavoriteBackup(
                await file.text(),
                collection.items.map((item) => item.id),
              );
              onImport(ids);
              setNotice(
                `Backup merged: ${ids.length} matching favorites. Unknown items were ignored.`,
              );
            } catch (error) {
              setNotice(error instanceof Error ? error.message : 'The backup could not be read.');
            }
          }}
        />
      </div>
      <p className="storage-note">
        Favorites stay in this browser. Use a backup to move them to another browser.
      </p>
      <p className="storage-note" role="status">
        {notice}
      </p>
    </section>
  );
}
