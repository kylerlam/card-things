import { useEffect, useState, type CSSProperties } from 'react';
import type { CollectionItem, Collection } from '../lib/types';
import { canLoadCollectionImage, collectionImageUrl } from '../lib/collectionImages';
import { Icon } from './Icon';

export function Cover({
  item,
  collection,
  className = '',
}: {
  item: CollectionItem;
  collection: Collection;
  className?: string;
}) {
  const [available, setAvailable] = useState<boolean>();
  const image = item.image;
  const imageSrc = image?.src;
  const category = collection.categories.find((entry) => entry.id === item.category);
  const generated = !image;
  const initials = item.title
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toLocaleUpperCase())
    .join('');

  useEffect(() => {
    if (!imageSrc) {
      setAvailable(undefined);
      return;
    }
    let current = true;
    setAvailable(undefined);
    void canLoadCollectionImage(imageSrc).then((result) => {
      if (current) setAvailable(result);
    });
    return () => {
      current = false;
    };
  }, [imageSrc]);

  const unavailable = Boolean(image) && available === false;
  return (
    <div
      className={`cover ${generated ? 'cover-generated' : ''} ${unavailable ? 'cover-unavailable' : ''} ${className}`}
      role={generated ? undefined : 'img'}
      aria-hidden={generated ? true : undefined}
      aria-label={image ? `${image.alt}${unavailable ? '. Image unavailable.' : ''}` : undefined}
      style={
        generated
          ? ({ '--cover-color': category?.color || 'var(--accent)' } as CSSProperties)
          : unavailable
            ? undefined
            : {
                backgroundImage: `url(${collectionImageUrl(image!.src)})`,
                backgroundPosition: image!.position || 'center',
                backgroundSize: image!.size || 'cover',
              }
      }
    >
      {generated ? (
        <span className="generated-cover-copy">
          <strong>{initials}</strong>
          <span>{category?.label || 'Collection'}</span>
        </span>
      ) : unavailable ? (
        <span className="cover-fallback">
          <Icon name="image" />
          Image unavailable
        </span>
      ) : null}
    </div>
  );
}

export function CategoryLabel({
  category,
  collection,
}: {
  category: string;
  collection: Collection;
}) {
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
  collection,
}: {
  item: CollectionItem;
  favorite: boolean;
  onOpen: () => void;
  onFavorite: () => void;
  collection: Collection;
}) {
  return (
    <article className="collection-card">
      <button
        className="card-open"
        onClick={(event) => {
          // WebKit does not consistently focus buttons activated by a pointer.
          event.currentTarget.focus({ preventScroll: true });
          onOpen();
        }}
        aria-label={`View ${item.title}`}
      >
        <Cover item={item} collection={collection} />
        <div className="card-copy">
          <CategoryLabel category={item.category} collection={collection} />
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
