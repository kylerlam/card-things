export type CatalogueView = { category: string; query: string; x: number; y: number };

let pendingDetail: string | null = null;

export function readCatalogueView(): CatalogueView | null {
  return window.history.state?.cardthingsCatalogueView ?? null;
}

export function rememberCatalogueView(view: CatalogueView, detail: string) {
  window.history.replaceState({ ...window.history.state, cardthingsCatalogueView: view }, "");
  pendingDetail = detail;
}

export function markCatalogueReturn(pathname: string) {
  if (pendingDetail !== pathname) return;
  pendingDetail = null;
  window.history.replaceState({ ...window.history.state, cardthingsCatalogueReturn: true }, "");
}

export function canReturnToCatalogue() {
  return window.history.state?.cardthingsCatalogueReturn === true;
}
