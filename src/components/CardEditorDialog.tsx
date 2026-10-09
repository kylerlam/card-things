import { useLayoutEffect, useRef, useState } from 'react';
import { buildCardUpdate, createCardDraft, type CardDraftField } from '../lib/cardEditor';
import { unavailableCollectionImages } from '../lib/collectionImages';
import type { Collection, CollectionItem } from '../lib/types';
import { Icon } from './Icon';

const fieldIds: Record<CardDraftField, string> = {
  title: 'card-title',
  category: 'card-category',
  description: 'card-description',
  details: 'card-details',
  tags: 'card-tags',
  added: 'card-added',
  url: 'card-url',
  imageSrc: 'card-image-src',
  imageAlt: 'card-image-alt',
};

export function CardEditorDialog({
  collection,
  item,
  onSave,
  onCancel,
}: {
  collection: Collection;
  item?: CollectionItem;
  onSave: (collection: Collection, item: CollectionItem) => void;
  onCancel: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const cancelled = useRef(false);
  const [draft, setDraft] = useState(() => createCardDraft(collection, item));
  const [errors, setErrors] = useState<ReturnType<typeof buildCardUpdate>['errors']>({});
  const [checking, setChecking] = useState(false);

  useLayoutEffect(() => {
    const dialog = dialogRef.current!;
    cancelled.current = false;
    returnFocus.current = document.activeElement as HTMLElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    titleRef.current?.focus();
    return () => {
      cancelled.current = true;
      dialog.close();
      document.body.style.overflow = previousOverflow;
      const target =
        returnFocus.current?.isConnected && returnFocus.current !== document.body
          ? returnFocus.current
          : document.querySelector('main');
      target?.focus();
    };
  }, []);

  function update(field: CardDraftField, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function describedBy(field: CardDraftField, hint?: string) {
    return [hint, errors[field] ? `${fieldIds[field]}-error` : ''].filter(Boolean).join(' ');
  }

  function focusFirstError(nextErrors: typeof errors) {
    const field = (Object.keys(fieldIds) as CardDraftField[]).find((key) => nextErrors[key]);
    if (field)
      window.requestAnimationFrame(() => document.getElementById(fieldIds[field])?.focus());
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (checking) return;
    const result = buildCardUpdate(collection, draft, item?.id);
    if (!result.collection || !result.item) {
      setErrors(result.errors);
      focusFirstError(result.errors);
      return;
    }

    if (result.item.image) {
      setChecking(true);
      const imageErrors = await unavailableCollectionImages({
        ...result.collection,
        items: [result.item],
      });
      if (cancelled.current) return;
      setChecking(false);
      if (imageErrors.length) {
        const nextErrors = {
          imageSrc: 'Image path could not be loaded from this CardThings site.',
        };
        setErrors(nextErrors);
        focusFirstError(nextErrors);
        return;
      }
    }
    onSave(result.collection, result.item);
  }

  return (
    <dialog
      ref={dialogRef}
      className="data-dialog card-editor-dialog"
      aria-labelledby="card-editor-title"
      aria-describedby="card-editor-description"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return;
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled])',
          ),
        );
        if (!controls.length) return;
        const current = controls.indexOf(document.activeElement as HTMLElement);
        const next = event.shiftKey
          ? current <= 0
            ? controls.length - 1
            : current - 1
          : (current + 1) % controls.length;
        event.preventDefault();
        controls[next].focus();
      }}
    >
      <div className="data-dialog-header">
        <div>
          <p className="dialog-label">Local workspace</p>
          <h2 id="card-editor-title">{item ? 'Edit card' : 'Add a card'}</h2>
        </div>
        <button className="icon-button" aria-label="Cancel card editing" onClick={onCancel}>
          <Icon name="close" />
        </button>
      </div>
      <p id="card-editor-description" className="data-dialog-intro">
        {item
          ? 'Update this card. Its stable link and saved favorite stay connected.'
          : 'Add one useful entry to this browser collection. A cover is generated automatically.'}
      </p>
      <form className="card-editor-form" onSubmit={(event) => void submit(event)} noValidate>
        {Object.keys(errors).length ? (
          <div className="editor-errors" role="alert">
            <p>Please fix the highlighted fields.</p>
            <ul>
              {Object.entries(errors).map(([field, error]) => (
                <li key={field}>{error}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="form-field form-field-wide">
          <label htmlFor={fieldIds.title}>Title</label>
          <input
            ref={titleRef}
            id={fieldIds.title}
            value={draft.title}
            aria-required="true"
            aria-invalid={Boolean(errors.title)}
            aria-describedby={describedBy('title') || undefined}
            onChange={(event) => update('title', event.target.value)}
          />
          {errors.title ? <p id={`${fieldIds.title}-error`}>{errors.title}</p> : null}
        </div>
        <div className="form-field">
          <label htmlFor={fieldIds.category}>Category</label>
          <select
            id={fieldIds.category}
            value={draft.category}
            aria-required="true"
            aria-invalid={Boolean(errors.category)}
            aria-describedby={describedBy('category') || undefined}
            onChange={(event) => update('category', event.target.value)}
          >
            {collection.categories.length ? null : (
              <option value="">No categories available</option>
            )}
            {collection.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
          {errors.category ? <p id={`${fieldIds.category}-error`}>{errors.category}</p> : null}
        </div>
        <div className="form-field">
          <label htmlFor={fieldIds.added}>Date added</label>
          <input
            id={fieldIds.added}
            type="date"
            value={draft.added}
            aria-required="true"
            aria-invalid={Boolean(errors.added)}
            aria-describedby={describedBy('added') || undefined}
            onChange={(event) => update('added', event.target.value)}
          />
          {errors.added ? <p id={`${fieldIds.added}-error`}>{errors.added}</p> : null}
        </div>
        <div className="form-field form-field-wide">
          <label htmlFor={fieldIds.description}>Short description</label>
          <input
            id={fieldIds.description}
            value={draft.description}
            aria-required="true"
            aria-invalid={Boolean(errors.description)}
            aria-describedby={describedBy('description') || undefined}
            onChange={(event) => update('description', event.target.value)}
          />
          {errors.description ? (
            <p id={`${fieldIds.description}-error`}>{errors.description}</p>
          ) : null}
        </div>
        <div className="form-field form-field-wide">
          <label htmlFor={fieldIds.details}>Details</label>
          <textarea
            id={fieldIds.details}
            rows={5}
            value={draft.details}
            aria-required="true"
            aria-invalid={Boolean(errors.details)}
            aria-describedby={describedBy('details') || undefined}
            onChange={(event) => update('details', event.target.value)}
          />
          {errors.details ? <p id={`${fieldIds.details}-error`}>{errors.details}</p> : null}
        </div>
        <div className="form-field form-field-wide">
          <label htmlFor={fieldIds.tags}>
            Tags <span>(optional)</span>
          </label>
          <input
            id={fieldIds.tags}
            value={draft.tags}
            placeholder="Research, Design, Reference"
            aria-invalid={Boolean(errors.tags)}
            aria-describedby={describedBy('tags', 'card-tags-hint')}
            onChange={(event) => update('tags', event.target.value)}
          />
          <p id="card-tags-hint">Separate tags with commas.</p>
          {errors.tags ? <p id={`${fieldIds.tags}-error`}>{errors.tags}</p> : null}
        </div>
        <div className="form-field form-field-wide">
          <label htmlFor={fieldIds.url}>
            Resource link <span>(optional)</span>
          </label>
          <input
            id={fieldIds.url}
            inputMode="url"
            value={draft.url}
            placeholder="https://example.com/resource"
            aria-invalid={Boolean(errors.url)}
            aria-describedby={describedBy('url', 'card-url-hint')}
            onChange={(event) => update('url', event.target.value)}
          />
          <p id="card-url-hint">Use a complete http:// or https:// address.</p>
          {errors.url ? <p id={`${fieldIds.url}-error`}>{errors.url}</p> : null}
        </div>
        <fieldset className="cover-fields form-field-wide">
          <legend>
            Custom cover <span>(optional)</span>
          </legend>
          <p>Leave both fields empty to use a generated cover.</p>
          <div className="form-field">
            <label htmlFor={fieldIds.imageSrc}>Image path</label>
            <input
              id={fieldIds.imageSrc}
              value={draft.imageSrc}
              placeholder="images/my-cover.webp"
              aria-invalid={Boolean(errors.imageSrc)}
              aria-describedby={describedBy('imageSrc', 'card-image-hint')}
              onChange={(event) => update('imageSrc', event.target.value)}
            />
            <p id="card-image-hint">
              Relative to this site's public folder; remote URLs are blocked.
            </p>
            {errors.imageSrc ? <p id={`${fieldIds.imageSrc}-error`}>{errors.imageSrc}</p> : null}
          </div>
          <div className="form-field">
            <label htmlFor={fieldIds.imageAlt}>Image description</label>
            <input
              id={fieldIds.imageAlt}
              value={draft.imageAlt}
              aria-invalid={Boolean(errors.imageAlt)}
              aria-describedby={describedBy('imageAlt', 'card-image-alt-hint')}
              onChange={(event) => update('imageAlt', event.target.value)}
            />
            <p id="card-image-alt-hint">Required when an image path is used.</p>
            {errors.imageAlt ? <p id={`${fieldIds.imageAlt}-error`}>{errors.imageAlt}</p> : null}
          </div>
        </fieldset>
        {checking ? (
          <p className="editor-status" role="status">
            Checking the local cover image…
          </p>
        ) : null}
        <div className="editor-actions">
          <button type="button" className="secondary-button" onClick={onCancel} disabled={checking}>
            Cancel
          </button>
          <button type="submit" className="primary-button" disabled={checking}>
            {item ? 'Save changes' : 'Add card'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
