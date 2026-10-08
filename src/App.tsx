import { useEffect, useRef, useState } from 'react';
import { collection, filterItems } from './lib/collection';
import type { CollectionItem } from './lib/types';
import { useFavorites } from './lib/useFavorites';
import { Sidebar } from './components/Sidebar';
import { CollectionCard } from './components/CollectionCard';
import { ItemDialog } from './components/ItemDialog';
import { Icon } from './components/Icon';

export default function App() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sort, setSort] = useState('recent');
  const [selectedItem, setSelectedItem] = useState<CollectionItem | null>(null);
  const { favorites, toggleFavorite, savedLocally } = useFavorites();
  const searchRef = useRef<HTMLInputElement>(null);
  const items = filterItems(collection.items, query, category, favorites, favoritesOnly, sort);
  const currentLabel = favoritesOnly
    ? 'Favorites'
    : collection.categories.find((entry) => entry.id === category)?.label || 'All items';

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (
        event.key === '/' &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !target.matches('input, textarea, select, [contenteditable="true"]') &&
        !document.querySelector('dialog[open]')
      ) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  function navigate(nextCategory: string, nextFavorites: boolean) {
    setCategory(nextCategory);
    setFavoritesOnly(nextFavorites);
    setQuery('');
  }

  return (
    <>
      <a className="skip-link" href="#collection">
        Skip to collection
      </a>
      <Sidebar
        category={category}
        favoritesOnly={favoritesOnly}
        favoriteCount={favorites.length}
        onNavigate={navigate}
      />
      <main id="collection" tabIndex={-1}>
        <header className="topbar">
          <p>
            Collection<span aria-hidden="true">/</span>
            <span>{currentLabel}</span>
          </p>
          {collection.example ? (
            <span className="example-status">
              <span />
              Example collection
            </span>
          ) : null}
        </header>
        <section className="intro" aria-labelledby="page-title">
          <h1 id="page-title">{favoritesOnly ? 'Keep your favorites close.' : collection.title}</h1>
          <p>
            {favoritesOnly
              ? 'The things you love, ready when you need them.'
              : collection.description}
          </p>
        </section>
        <div className="search-box">
          <Icon name="search" />
          <label htmlFor="collection-search" className="sr-only">
            Search collection
          </label>
          <input
            ref={searchRef}
            id="collection-search"
            type="search"
            placeholder="Search your collection..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query ? (
            <button
              className="icon-button"
              aria-label="Clear search"
              onClick={() => {
                setQuery('');
                searchRef.current?.focus();
              }}
            >
              <Icon name="close" />
            </button>
          ) : (
            <kbd aria-hidden="true">/</kbd>
          )}
        </div>
        <div className="collection-toolbar">
          <p className="result-count" role="status" aria-live="polite">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </p>
          <div className="filter-chips" role="group" aria-label="Filter by category">
            {[{ id: 'all', label: 'All' }, ...collection.categories].map((entry) => (
              <button
                key={entry.id}
                aria-pressed={category === entry.id}
                onClick={() => setCategory(entry.id)}
              >
                {entry.label}
              </button>
            ))}
          </div>
          <div className="sort-control">
            <label htmlFor="sort" className="sr-only">
              Sort items
            </label>
            <select id="sort" value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="recent">Recently added</option>
              <option value="title">Title: A to Z</option>
            </select>
            <Icon name="chevron" />
          </div>
        </div>
        {!savedLocally ? (
          <p role="status" className="storage-note">
            Favorites are available for this visit. Your browser could not save them for next time.
          </p>
        ) : null}
        {items.length ? (
          <section className="card-grid" aria-label="Collection items">
            {items.map((item) => (
              <CollectionCard
                key={item.id}
                item={item}
                favorite={favorites.includes(item.id)}
                onOpen={() => setSelectedItem(item)}
                onFavorite={() => toggleFavorite(item.id)}
              />
            ))}
          </section>
        ) : (
          <section className="empty-state">
            <Icon name={favoritesOnly && !query && category === 'all' ? 'heart' : 'search'} />
            <h2>
              {favoritesOnly && !query && category === 'all'
                ? 'A place for your favorites.'
                : 'Nothing here just yet.'}
            </h2>
            <p>
              {favoritesOnly && !query && category === 'all'
                ? 'Tap a heart on any card to keep it here.'
                : 'Try a different search or clear your filters to explore again.'}
            </p>
            <button className="primary-button" onClick={() => navigate('all', false)}>
              {favoritesOnly && !query && category === 'all'
                ? 'Explore all items'
                : 'Reset filters'}
            </button>
          </section>
        )}
        <footer className="collection-footer">
          <span>Thoughtfully collected. Always within reach.</span>
          <span>Made with CardThings</span>
        </footer>
      </main>
      {selectedItem ? (
        <ItemDialog
          item={selectedItem}
          favorite={favorites.includes(selectedItem.id)}
          onFavorite={() => toggleFavorite(selectedItem.id)}
          onClose={() => setSelectedItem(null)}
        />
      ) : null}
    </>
  );
}
