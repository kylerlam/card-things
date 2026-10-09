import { useLayoutEffect, useRef, useState } from 'react';
import {
  buildCollectionSettingsUpdate,
  createCategoryId,
  createCollectionSettingsDraft,
  normalizePickerColor,
  type CollectionSettingsErrors,
} from '../lib/collectionSettings';
import type { Collection } from '../lib/types';
import { Icon } from './Icon';

const defaultCategoryColor = '#3f6b58';

export function CollectionSettingsDialog({
  collection,
  returnFocusTarget,
  onSave,
  onCancel,
}: {
  collection: Collection;
  returnFocusTarget: HTMLElement | null;
  onSave: (collection: Collection) => void;
  onCancel: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const initialCollection = useRef(collection);
  const titleRef = useRef<HTMLInputElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const [draft, setDraft] = useState(() => createCollectionSettingsDraft(collection));
  const [errors, setErrors] = useState<CollectionSettingsErrors>({ categories: {}, form: [] });
  const [newCategory, setNewCategory] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(defaultCategoryColor);
  const [newCategoryError, setNewCategoryError] = useState('');
  const collectionChanged = collection !== initialCollection.current;

  useLayoutEffect(() => {
    const dialog = dialogRef.current!;
    returnFocus.current = document.activeElement as HTMLElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    titleRef.current?.focus();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      const target = returnFocusTarget?.isConnected
        ? returnFocusTarget
        : returnFocus.current?.isConnected && returnFocus.current !== document.body
          ? returnFocus.current
          : document.querySelector('main');
      target?.focus();
    };
  }, [returnFocusTarget]);

  function updateText(field: 'title' | 'description', value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function updateCategory(index: number, field: 'label' | 'color', value: string) {
    setDraft((current) => ({
      ...current,
      categories: current.categories.map((category, categoryIndex) =>
        categoryIndex === index ? { ...category, [field]: value } : category,
      ),
    }));
    setErrors((current) => {
      if (!current.categories[index]?.[field]) return current;
      const categoryErrors = { ...current.categories[index], [field]: undefined };
      return { ...current, categories: { ...current.categories, [index]: categoryErrors } };
    });
  }

  function addCategory() {
    const label = newCategory.trim();
    if (!label) {
      setNewCategoryError('Category name must be a non-empty string.');
      window.requestAnimationFrame(() => document.getElementById('new-category-name')?.focus());
      return;
    }
    const category = {
      id: createCategoryId(label, draft.categories),
      label,
      color: newCategoryColor,
    };
    setDraft((current) => ({ ...current, categories: [...current.categories, category] }));
    setNewCategory('');
    setNewCategoryColor(defaultCategoryColor);
    setNewCategoryError('');
  }

  function focusFirstError(nextErrors: CollectionSettingsErrors) {
    let id = nextErrors.title
      ? 'collection-settings-title'
      : nextErrors.description
        ? 'collection-settings-description'
        : '';
    if (!id) {
      const index = Object.keys(nextErrors.categories)
        .map(Number)
        .sort((left, right) => left - right)[0];
      if (index !== undefined) {
        const field = nextErrors.categories[index].label ? 'name' : 'color';
        id = `collection-category-${index}-${field}`;
      }
    }
    if (id) window.requestAnimationFrame(() => document.getElementById(id)?.focus());
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (collectionChanged) return;
    const result = buildCollectionSettingsUpdate(collection, draft);
    if (!result.collection) {
      setErrors(result.errors);
      focusFirstError(result.errors);
      return;
    }
    onSave(result.collection);
  }

  const errorCount =
    Number(Boolean(errors.title)) +
    Number(Boolean(errors.description)) +
    errors.form.length +
    Object.values(errors.categories).reduce(
      (count, category) =>
        count + Number(Boolean(category.label)) + Number(Boolean(category.color)),
      0,
    );

  return (
    <dialog
      ref={dialogRef}
      className="data-dialog collection-settings-dialog"
      aria-labelledby="collection-settings-heading"
      aria-describedby="collection-settings-intro"
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
          <h2 id="collection-settings-heading">Collection settings</h2>
        </div>
        <button className="icon-button" aria-label="Cancel collection settings" onClick={onCancel}>
          <Icon name="close" />
        </button>
      </div>
      <p id="collection-settings-intro" className="data-dialog-intro">
        Shape this browser collection without editing JSON. Category IDs and card assignments stay
        connected when visible names change.
      </p>
      <form className="collection-settings-form" onSubmit={submit} noValidate>
        {collectionChanged ? (
          <div className="editor-errors" role="alert">
            <p>This collection changed in another tab.</p>
            <p>Cancel and reopen settings to review the latest version before saving.</p>
          </div>
        ) : null}
        {errorCount ? (
          <div className="editor-errors" role="alert">
            <p>Please fix the highlighted fields.</p>
            {errors.form.length ? (
              <ul>
                {errors.form.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
        <section className="settings-section" aria-labelledby="collection-copy-heading">
          <div className="settings-section-heading">
            <div>
              <h3 id="collection-copy-heading">Collection copy</h3>
              <p>Shown at the top of the collection.</p>
            </div>
          </div>
          <div className="form-field">
            <label htmlFor="collection-settings-title">Title</label>
            <input
              ref={titleRef}
              id="collection-settings-title"
              value={draft.title}
              aria-required="true"
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? 'collection-settings-title-error' : undefined}
              onChange={(event) => updateText('title', event.target.value)}
            />
            {errors.title ? <p id="collection-settings-title-error">{errors.title}</p> : null}
          </div>
          <div className="form-field">
            <label htmlFor="collection-settings-description">Description</label>
            <textarea
              id="collection-settings-description"
              rows={3}
              value={draft.description}
              aria-required="true"
              aria-invalid={Boolean(errors.description)}
              aria-describedby={
                errors.description ? 'collection-settings-description-error' : undefined
              }
              onChange={(event) => updateText('description', event.target.value)}
            />
            {errors.description ? (
              <p id="collection-settings-description-error">{errors.description}</p>
            ) : null}
          </div>
        </section>
        <section className="settings-section" aria-labelledby="collection-categories-heading">
          <div className="settings-section-heading">
            <div>
              <h3 id="collection-categories-heading">Categories</h3>
              <p>Rename or recolor safely. Stable IDs are shown for reference and never change.</p>
            </div>
            <span>{draft.categories.length}</span>
          </div>
          <div className="category-settings-list">
            {draft.categories.map((category, index) => {
              const categoryErrors = errors.categories[index] || {};
              const labelId = `collection-category-${index}-name`;
              const colorId = `collection-category-${index}-color`;
              return (
                <fieldset className="category-settings-row" key={category.id}>
                  <legend>Category {index + 1}</legend>
                  <div className="form-field">
                    <label htmlFor={labelId}>Name</label>
                    <input
                      id={labelId}
                      value={category.label}
                      aria-required="true"
                      aria-invalid={Boolean(categoryErrors.label)}
                      aria-describedby={
                        categoryErrors.label ? `${labelId}-error ${labelId}-id` : `${labelId}-id`
                      }
                      onChange={(event) => updateCategory(index, 'label', event.target.value)}
                    />
                    <p id={`${labelId}-id`}>
                      Stable ID: <code>{category.id}</code>
                    </p>
                    {categoryErrors.label ? (
                      <p id={`${labelId}-error`}>{categoryErrors.label}</p>
                    ) : null}
                  </div>
                  <div className="form-field category-color-field">
                    <label htmlFor={colorId}>Color</label>
                    <div className="category-color-control">
                      <input
                        type="color"
                        aria-label={`${category.label || `Category ${index + 1}`} color picker`}
                        value={normalizePickerColor(category.color)}
                        onChange={(event) => updateCategory(index, 'color', event.target.value)}
                      />
                      <input
                        id={colorId}
                        value={category.color}
                        inputMode="text"
                        spellCheck="false"
                        aria-required="true"
                        aria-invalid={Boolean(categoryErrors.color)}
                        aria-describedby={categoryErrors.color ? `${colorId}-error` : undefined}
                        onChange={(event) => updateCategory(index, 'color', event.target.value)}
                      />
                    </div>
                    {categoryErrors.color ? (
                      <p id={`${colorId}-error`}>{categoryErrors.color}</p>
                    ) : null}
                  </div>
                </fieldset>
              );
            })}
          </div>
          <fieldset className="new-category-fields">
            <legend>Add category</legend>
            <div className="form-field">
              <label htmlFor="new-category-name">Name</label>
              <input
                id="new-category-name"
                value={newCategory}
                aria-invalid={Boolean(newCategoryError)}
                aria-describedby={newCategoryError ? 'new-category-name-error' : undefined}
                onChange={(event) => {
                  setNewCategory(event.target.value);
                  setNewCategoryError('');
                }}
              />
              {newCategoryError ? <p id="new-category-name-error">{newCategoryError}</p> : null}
            </div>
            <div className="form-field new-category-color">
              <label htmlFor="new-category-color">Color</label>
              <input
                id="new-category-color"
                type="color"
                value={newCategoryColor}
                onChange={(event) => setNewCategoryColor(event.target.value)}
              />
            </div>
            <button type="button" className="secondary-button" onClick={addCategory}>
              <Icon name="plus" />
              Add category
            </button>
          </fieldset>
          <p className="settings-boundary">
            Category removal is intentionally unavailable here, so existing cards cannot be detached
            by accident.
          </p>
        </section>
        <div className="editor-actions">
          <button type="button" className="secondary-button" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="primary-button" disabled={collectionChanged}>
            Save settings
          </button>
        </div>
      </form>
    </dialog>
  );
}
