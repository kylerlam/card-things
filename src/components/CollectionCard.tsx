import { collection } from '../lib/collection';
import type { CollectionItem } from '../lib/types';
import { Icon } from './Icon';

export function Cover({ item, className = '' }: { item: CollectionItem; className?: string }) {
  return (
    <div
      className={`cover ${className}`}
      role="img"
      aria-label={item.image.alt}
      style={{
        backgroundImage: `url(${import.meta.env.BASE_URL}${item.image.src})`,
        backgroundPosition: item.image.position || 'center',
        backgroundSize: item.image.size || 'cover',
      }}
    />
  );
}

export function CategoryLabel({ category }: { category: string }) {
  const entry = collection.categories.find((value) => value.id === category);
  return (
    <span className="category-label">
      <span className="category-dot" style={{ backgroundColor: entry?.color }} />
      {entry?.label || category}
    </span>
  );
}

export function CollectionCard({
  item,
  favorite,
  onOpen,
  onFavorite,
}: {
  item: CollectionItem;
  favorite: boolean;
  onOpen: () => void;
  onFavorite: () => void;
}) {
  return (
    <article className="collection-card">
      <button className="card-open" onClick={onOpen} aria-label={`View ${item.title}`}>
        <Cover item={item} />
        <div className="card-copy">
          <CategoryLabel category={item.category} />
          <h2>
            {item.title}
            <Icon name="arrow" />
          </h2>
          <p>{item.description}</p>
        </div>
      </button>
      <div className="card-footer">
        <ul className="tags" aria-label="Tags">
          {item.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
        <button
          className="icon-button favorite-button"
          aria-label={`${favorite ? 'Unfavorite' : 'Favorite'} ${item.title}`}
          aria-pressed={favorite}
          onClick={onFavorite}
        >
          <Icon name="heart" fill={favorite ? 'currentColor' : 'none'} />
        </button>
      </div>
    </article>
  );
}
