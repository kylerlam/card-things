import { Brand, Icon } from './Icon';
import brand from '../content/brand';
import type { Collection } from '../lib/types';

interface Props {
  collection: Collection;
  category: string;
  favoritesOnly: boolean;
  favoriteCount: number;
  onNavigate: (category: string, favoritesOnly: boolean) => void;
}

export function Sidebar({ collection, category, favoritesOnly, favoriteCount, onNavigate }: Props) {
  return (
    <aside className="sidebar">
      <button
        className="brand-button"
        onClick={() => onNavigate('all', false)}
        aria-label={`${brand.name} home`}
      >
        <Brand />
      </button>
      <nav aria-label="Collection navigation">
        <p className="nav-label">Collection</p>
        <div className="primary-nav">
          <button
            className="nav-item"
            aria-current={!favoritesOnly && category === 'all' ? 'page' : undefined}
            onClick={() => onNavigate('all', false)}
          >
            <Icon name="grid" />
            <span>All items</span>
            <span className="count">{collection.items.length}</span>
          </button>
          <button
            className="nav-item"
            aria-current={favoritesOnly ? 'page' : undefined}
            onClick={() => onNavigate('all', true)}
          >
            <Icon name="heart" />
            <span>Favorites</span>
            <span className="count">{favoriteCount}</span>
          </button>
        </div>
        <div className="category-nav">
          <p className="nav-label">Categories</p>
          {collection.categories.map((entry) => (
            <button
              key={entry.id}
              className="nav-item"
              aria-current={!favoritesOnly && category === entry.id ? 'page' : undefined}
              onClick={() => onNavigate(entry.id, false)}
            >
              <span className="category-dot" style={{ backgroundColor: entry.color }} />
              <span>{entry.label}</span>
              <span className="count">
                {collection.items.filter((item) => item.category === entry.id).length}
              </span>
            </button>
          ))}
        </div>
      </nav>
      <footer className="sidebar-footer">
        <p>{brand.tagline}</p>
        <a href={brand.repositoryUrl} target="_blank" rel="noreferrer">
          <Icon name="github" />
          View on GitHub<span className="sr-only"> (opens in a new tab)</span>
        </a>
      </footer>
    </aside>
  );
}
