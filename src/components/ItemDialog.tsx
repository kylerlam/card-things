import { useLayoutEffect, useRef } from 'react';
import { safeItemUrl } from '../lib/collection';
import type { Collection, CollectionItem } from '../lib/types';
import { CategoryLabel, Cover } from './CollectionCard';
import { Icon } from './Icon';
import { CopyLinkButton } from './CopyLinkButton';
import brand from '../content/brand';

export function ItemDialog({
  item,
  shareUrl,
  favorite,
  onFavorite,
  onClose,
  collection,
}: {
  item: CollectionItem;
  shareUrl: string;
  favorite: boolean;
  onFavorite: () => void;
  onClose: () => void;
  collection: Collection;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const url = safeItemUrl(item.url);
  useLayoutEffect(() => {
    const dialog = ref.current!;
    returnFocus.current ??= document.activeElement as HTMLElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      const target =
        returnFocus.current?.isConnected && returnFocus.current !== document.body
          ? returnFocus.current
          : document.querySelector('main');
      target?.focus();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      className="item-dialog"
      aria-labelledby="detail-title"
      aria-describedby="detail-description"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return;
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not([disabled]), a[href], input:not([disabled])',
          ),
        );
        if (!controls.length) return;
        // Keep every dialog control reachable regardless of macOS tab-focus preferences.
        const current = controls.indexOf(document.activeElement as HTMLElement);
        const next = event.shiftKey
          ? current <= 0
            ? controls.length - 1
            : current - 1
          : (current + 1) % controls.length;
        event.preventDefault();
        controls[next].focus();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          onClose();
      }}
    >
      <div className="dialog-hero">
        <Cover item={item} />
        <button className="icon-button close-button" aria-label="Close details" onClick={onClose}>
          <Icon name="close" />
        </button>
      </div>
      <div className="dialog-content">
        <CategoryLabel category={item.category} collection={collection} />
        <h2 id="detail-title">{item.title}</h2>
        <p id="detail-description" className="detail-description">
          {item.description}
        </p>
        <p className="detail-body">{item.details}</p>
        <ul className="tags" aria-label="Tags">
          {item.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
        <dl className="detail-meta">
          <div>
            <dt>Added to collection</dt>
            <dd>
              {new Intl.DateTimeFormat('en', { dateStyle: 'long', timeZone: 'UTC' }).format(
                new Date(`${item.added}T00:00:00Z`),
              )}
            </dd>
          </div>
          <div>
            <dt>Collection</dt>
            <dd>{collection.example ? 'Example collection' : brand.name}</dd>
          </div>
        </dl>
        {collection.example ? (
          <p className="example-note">
            An illustrative entry made for the {brand.name} demo. Names, descriptions, and cover art
            are sample content.
          </p>
        ) : null}
        <div className="dialog-actions">
          <button className="primary-button" aria-pressed={favorite} onClick={onFavorite}>
            <Icon name="heart" fill={favorite ? 'currentColor' : 'none'} />
            {favorite ? 'Saved to favorites' : 'Save to favorites'}
          </button>
          <CopyLinkButton url={shareUrl} label="Copy item link" />
          {url ? (
            <a className="secondary-button" href={url} target="_blank" rel="noreferrer">
              Visit resource
              <Icon name="arrow" />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : null}
        </div>
      </div>
    </dialog>
  );
}
