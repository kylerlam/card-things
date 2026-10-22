import { useEffect, useRef } from 'react';
import { collection, filterItems } from './lib/collection';
import { useCollectionUrl } from './lib/useCollectionUrl';
import { CopyLinkButton } from './components/CopyLinkButton';
import { FavoritesBackup } from './components/FavoritesBackup';
import { useFavorites } from './lib/useFavorites';
import { Sidebar } from './components/Sidebar';
import { CollectionCard } from './components/CollectionCard';
import { ItemDialog } from './components/ItemDialog';
import { Icon } from './components/Icon';
import brand from './content/brand';

export default function App() {
  const { view, shareUrl, updateView, updateQuery, finishSearch, closeDetail, navigateDetail } =
    useCollectionUrl();
  const { query, category, tag, favoritesOnly, sort, itemId, layout } = view;
  const selectedItem = collection.items.find((item) => item.id === itemId);
  const { favorites, toggleFavorite, importFavorites, savedLocally } = useFavorites();
  const searchRef = useRef<HTMLInputElement>(null);
  const items = filterItems(collection.items, query, category, favorites, favoritesOnly, sort, tag);
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

  function clearFilters() {
    updateView({ query: '', category: 'all', tag: '', itemId: '' });
  }

  function navigate(nextCategory: string, nextFavorites: boolean) {
    updateView({
      category: nextCategory,
      favoritesOnly: nextFavorites,
      query: '',
      tag: '',
      itemId: '',
    });
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
          <div className="topbar-actions">
            {collection.example ? (
              <span className="example-status">
                <span />
                Example collection
              </span>
            ) : null}
            <CopyLinkButton url={shareUrl} label="Copy collection link" />
          </div>
        </header>
        <section className="intro" aria-labelledby="page-title">
          <h1 id="page-title">{favoritesOnly ? 'Keep your favorites close.' : collection.title}</h1>
          <p>
            {favoritesOnly
              ? 'The things you love, ready when you need them.'
              : collection.description}
          </p>
        </section>
        {favoritesOnly ? (
          <FavoritesBackup favorites={favorites} onImport={importFavorites} />
        ) : null}
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
            maxLength={200}
            onBlur={finishSearch}
            onChange={(event) => updateQuery(event.target.value)}
          />
          {query ? (
            <button
              className="icon-button"
              aria-label="Clear search"
              onClick={() => {
                updateView({ query: '' });
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
                onClick={() => updateView({ category: entry.id })}
              >
                {entry.label}
              </button>
            ))}
          </div>
          <div className="sort-control">
            <label htmlFor="sort" className="sr-only">
              Sort items
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(event) => updateView({ sort: event.target.value as typeof sort })}
            >
              <option value="recent">Recently added</option>
              <option value="oldest">Oldest first</option>
              <option value="title">Title: A to Z</option>
              <option value="title-desc">Title: Z to A</option>
            </select>
            <Icon name="chevron" />
          </div>
          <div className="layout-control" role="group" aria-label="Collection layout">
            <button
              aria-label="Grid view"
              aria-pressed={layout === 'grid'}
              onClick={() => updateView({ layout: 'grid' })}
            >
              <Icon name="grid" />
            </button>
            <button
              aria-label="List view"
              aria-pressed={layout === 'list'}
              onClick={() => updateView({ layout: 'list' })}
            >
              <Icon name="list" />
            </button>
          </div>
        </div>
        {query || category !== 'all' || tag ? (
          <div className="active-filters" role="group" aria-label="Active filters">
            <span>Filtered by</span>
            {query ? (
              <button onClick={() => updateView({ query: '' })} aria-label="Remove search filter">
                <span>Search: {query}</span>
                <Icon name="close" />
              </button>
            ) : null}
            {category !== 'all' ? (
              <button
                onClick={() => updateView({ category: 'all' })}
                aria-label="Remove category filter"
              >
                <span>{collection.categories.find((entry) => entry.id === category)?.label}</span>
                <Icon name="close" />
              </button>
            ) : null}
            {tag ? (
              <button onClick={() => updateView({ tag: '' })} aria-label="Remove tag filter">
                <span>Tag: {tag}</span>
                <Icon name="close" />
              </button>
            ) : null}
            <button className="clear-filters" onClick={clearFilters}>
              Clear filters
            </button>
          </div>
        ) : null}
        {!savedLocally ? (
          <p role="status" className="storage-note">
            Favorites are available for this visit. Your browser could not save them for next time.
          </p>
        ) : null}
        {items.length ? (
          <section
            className={`card-grid${layout === 'list' ? ' card-list' : ''}`}
            aria-label="Collection items"
          >
            {items.map((item) => (
              <CollectionCard
                key={item.id}
                item={item}
                favorite={favorites.includes(item.id)}
                onOpen={() => updateView({ itemId: item.id })}
                onFavorite={() => toggleFavorite(item.id)}
                activeTag={tag}
                onTag={(tag) => updateView({ tag })}
              />
            ))}
          </section>
        ) : (
          <section className="empty-state">
            <Icon
              name={favoritesOnly && !query && !tag && category === 'all' ? 'heart' : 'search'}
            />
            <h2>
              {favoritesOnly && !query && !tag && category === 'all'
                ? 'A place for your favorites.'
                : 'Nothing here just yet.'}
            </h2>
            <p>
              {favoritesOnly && !query && !tag && category === 'all'
                ? 'Tap a heart on any card to keep it here.'
                : 'Try a different search or clear your filters to explore again.'}
            </p>
            <button
              className="primary-button"
              onClick={() =>
                favoritesOnly && !query && !tag && category === 'all'
                  ? navigate('all', false)
                  : clearFilters()
              }
            >
              {favoritesOnly && !query && !tag && category === 'all'
                ? 'Explore all items'
                : 'Reset filters'}
            </button>
          </section>
        )}
        <footer className="collection-footer">
          <span>{brand.footerNote}</span>
          <span>Made with {brand.name}</span>
        </footer>
      </main>
      {selectedItem ? (
        <ItemDialog
          item={selectedItem}
          items={items}
          onNavigate={navigateDetail}
          shareUrl={shareUrl}
          favorite={favorites.includes(selectedItem.id)}
          onFavorite={() => toggleFavorite(selectedItem.id)}
          onClose={closeDetail}
        />
      ) : null}
    </>
  );
}
