import { useLayoutEffect, useRef, useState } from 'react';
import type { Collection } from '../lib/types';
import { validateCollection } from '../lib/validateCollection';
import { Icon } from './Icon';

const maximumFileSize = 1_000_000;

export function CollectionDataDialog({
  collection,
  source,
  onImport,
  onReset,
  onClose,
}: {
  collection: Collection;
  source: 'bundled' | 'imported';
  onImport: (collection: Collection) => boolean;
  onReset: () => boolean;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [status, setStatus] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  useLayoutEffect(() => {
    const dialog = dialogRef.current!;
    returnFocus.current = document.activeElement as HTMLElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      returnFocus.current?.focus();
    };
  }, []);

  async function importFile(file?: File) {
    setErrors([]);
    setStatus('');
    setConfirmReset(false);
    if (!file) return;
    if (file.size > maximumFileSize) {
      setErrors(['File: must be 1 MB or smaller']);
      return;
    }
    try {
      const value: unknown = JSON.parse(await file.text());
      const validationErrors = validateCollection(value);
      if (validationErrors.length) {
        setErrors(validationErrors);
        return;
      }
      const next = value as Collection;
      const saved = onImport(next);
      setStatus(
        saved
          ? `Imported ${next.items.length} items and saved this collection in your browser.`
          : `Imported ${next.items.length} items for this visit. Browser storage is unavailable.`,
      );
    } catch {
      setErrors(['File: must contain valid JSON']);
    }
  }

  function exportCollection() {
    const blob = new Blob([`${JSON.stringify(collection, null, 2)}\n`], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const name =
      collection.title
        .toLocaleLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'collection';
    link.href = url;
    link.download = `${name}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    setStatus(`Exported ${collection.items.length} items as JSON.`);
  }

  function resetCollection() {
    const saved = onReset();
    setConfirmReset(false);
    setErrors([]);
    setStatus(
      saved
        ? 'Restored the bundled example collection.'
        : 'Restored the bundled collection for this visit. Browser storage is unavailable.',
    );
  }

  return (
    <dialog
      ref={dialogRef}
      className="data-dialog"
      aria-labelledby="data-title"
      aria-describedby="data-description"
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
          <h2 id="data-title">Collection data</h2>
        </div>
        <button
          ref={closeRef}
          className="icon-button"
          aria-label="Close collection data"
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </div>
      <p id="data-description" className="data-dialog-intro">
        Move a collection between CardThings sites with one JSON file. Imported data stays in this
        browser and never leaves this device.
      </p>
      <dl className="data-summary">
        <div>
          <dt>Active source</dt>
          <dd>{source === 'imported' ? 'Imported JSON' : 'Bundled collection'}</dd>
        </div>
        <div>
          <dt>Contents</dt>
          <dd>
            {collection.items.length} {collection.items.length === 1 ? 'item' : 'items'} ·{' '}
            {collection.categories.length}{' '}
            {collection.categories.length === 1 ? 'category' : 'categories'}
          </dd>
        </div>
      </dl>
      <div className="data-actions">
        <div>
          <h3>Import JSON</h3>
          <p>
            Choose a valid collection file up to 1 MB. The current collection changes only after
            validation.
          </p>
        </div>
        <label className="secondary-button file-action">
          <Icon name="upload" />
          Choose file
          <input
            type="file"
            accept="application/json,.json"
            aria-label="Import collection JSON"
            onChange={(event) => {
              void importFile(event.target.files?.[0]);
              event.currentTarget.value = '';
            }}
          />
        </label>
      </div>
      <div className="data-actions">
        <div>
          <h3>Export JSON</h3>
          <p>Download the active collection. Browser-local favorites are not included.</p>
        </div>
        <button className="secondary-button" onClick={exportCollection}>
          <Icon name="download" />
          Export
        </button>
      </div>
      {source === 'imported' ? (
        <div className="data-reset">
          {confirmReset ? (
            <div className="reset-confirm" role="group" aria-label="Confirm collection reset">
              <p>Replace the imported collection with the bundled example?</p>
              <div>
                <button className="secondary-button" onClick={() => setConfirmReset(false)}>
                  Keep imported
                </button>
                <button className="primary-button" onClick={resetCollection}>
                  Reset collection
                </button>
              </div>
            </div>
          ) : (
            <button className="text-button" onClick={() => setConfirmReset(true)}>
              Restore bundled collection
            </button>
          )}
        </div>
      ) : null}
      {errors.length ? (
        <div className="data-errors" role="alert">
          <p>Collection not imported. Fix the following:</p>
          <ul>
            {errors.slice(0, 8).map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
          {errors.length > 8 ? <p>And {errors.length - 8} more validation errors.</p> : null}
        </div>
      ) : null}
      {status ? (
        <p className="data-status" role="status">
          {status}
        </p>
      ) : null}
      <p className="data-note">
        Image paths must point to files already available in this site's <code>public/</code>{' '}
        directory. Favorites remain separate browser data.
      </p>
    </dialog>
  );
}
