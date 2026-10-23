import { useEffect, useRef, useState } from 'react';
import type { Collection } from './types';

interface ViewState {
  query: string;
  category: string;
  tag: string;
  favoritesOnly: boolean;
  sort: 'recent' | 'oldest' | 'title' | 'title-desc';
  itemId: string;
  layout: 'grid' | 'list';
}

function readView(collection: Collection): ViewState {
  const params = new URLSearchParams(window.location.search);
  const category = params.get('category') || 'all';
  const sort = params.get('sort');
  const itemId = params.get('item') || '';
  return {
    query: (params.get('q') || '').slice(0, 200),
    category: collection.categories.some((entry) => entry.id === category) ? category : 'all',
    tag: collection.items.some((item) => item.tags.includes(params.get('tag') || ''))
      ? params.get('tag')!
      : '',
    favoritesOnly: params.get('view') === 'favorites',
    sort: sort === 'title' || sort === 'title-desc' || sort === 'oldest' ? sort : 'recent',
    layout: params.get('layout') === 'list' ? 'list' : 'grid',
    itemId: collection.items.some((item) => item.id === itemId) ? itemId : '',
  };
}

function viewUrl(view: ViewState) {
  const url = new URL(window.location.href);
  url.search = '';
  if (view.query) url.searchParams.set('q', view.query);
  if (view.category !== 'all') url.searchParams.set('category', view.category);
  if (view.tag) url.searchParams.set('tag', view.tag);
  if (view.favoritesOnly) url.searchParams.set('view', 'favorites');
  if (view.sort !== 'recent') url.searchParams.set('sort', view.sort);
  if (view.layout === 'list') url.searchParams.set('layout', 'list');
  if (view.itemId) url.searchParams.set('item', view.itemId);
  return url.href;
}

export function useCollectionUrl(collection: Collection) {
  const [view, setView] = useState(() => readView(collection));
  const editingSearch = useRef(false);
  const closingDetail = useRef(false);

  useEffect(() => {
    function syncLocation() {
      const next = readView(collection);
      const canonical = viewUrl(next);
      if (canonical !== window.location.href)
        window.history.replaceState(window.history.state, '', canonical);
      editingSearch.current = false;
      closingDetail.current = false;
      setView(next);
    }
    syncLocation();
    window.addEventListener('popstate', syncLocation);
    return () => window.removeEventListener('popstate', syncLocation);
  }, [collection]);

  function writeView(patch: Partial<ViewState>, mode: 'push' | 'replace') {
    const current = readView(collection);
    const next = { ...current, ...patch };
    const url = viewUrl(next);
    if (url === viewUrl(current)) return false;
    const detail =
      next.itemId && next.itemId !== current.itemId
        ? { item: next.itemId, background: viewUrl({ ...next, itemId: '' }) }
        : null;
    const historyState = { ...window.history.state, cardthingsDetail: detail };
    if (mode === 'push') window.history.pushState(historyState, '', url);
    else window.history.replaceState(historyState, '', url);
    setView(next);
    return true;
  }

  function updateView(patch: Partial<ViewState>) {
    editingSearch.current = false;
    writeView(patch, 'push');
  }

  function updateQuery(query: string) {
    if (writeView({ query: query.slice(0, 200) }, editingSearch.current ? 'replace' : 'push')) {
      editingSearch.current = true;
    }
  }

  function navigateDetail(itemId: string) {
    if (closingDetail.current) return;
    const current = readView(collection);
    if (!current.itemId || !collection.items.some((item) => item.id === itemId)) return;
    const next = { ...current, itemId };
    const detail = window.history.state?.cardthingsDetail;
    const validBackground =
      detail?.item === current.itemId && detail.background === viewUrl({ ...current, itemId: '' });
    window.history.replaceState(
      {
        ...window.history.state,
        cardthingsDetail: validBackground ? { ...detail, item: itemId } : null,
      },
      '',
      viewUrl(next),
    );
    setView(next);
  }

  function closeDetail() {
    if (closingDetail.current) return;
    const current = readView(collection);
    if (!current.itemId) return;
    const detail = window.history.state?.cardthingsDetail;
    if (
      detail?.item === current.itemId &&
      detail.background === viewUrl({ ...current, itemId: '' })
    ) {
      closingDetail.current = true;
      window.history.back();
    } else {
      // A directly shared detail must close into this collection, not leave the site.
      writeView({ itemId: '' }, 'replace');
    }
  }

  return {
    view,
    shareUrl: viewUrl(view),
    updateView,
    updateQuery,
    finishSearch: () => {
      editingSearch.current = false;
    },
    closeDetail,
    navigateDetail,
  };
}
