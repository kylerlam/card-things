import type { Collection, CollectionItem } from './types';
import { validateCollection } from './validateCollection';

export interface CardDraft {
  title: string;
  category: string;
  description: string;
  details: string;
  tags: string;
  added: string;
  url: string;
  imageSrc: string;
  imageAlt: string;
}

export type CardDraftField = keyof CardDraft;
export type CardDraftErrors = Partial<Record<CardDraftField, string>>;

export function createCardDraft(
  collection: Collection,
  item?: CollectionItem,
  date = new Date(),
): CardDraft {
  return {
    title: item?.title || '',
    category: item?.category || collection.categories[0]?.id || '',
    description: item?.description || '',
    details: item?.details || '',
    tags: item?.tags.join(', ') || '',
    added: item?.added || date.toISOString().slice(0, 10),
    url: item?.url || '',
    imageSrc: item?.image?.src || '',
    imageAlt: item?.image?.alt || '',
  };
}

function createItemId(title: string, existingIds: Set<string>) {
  const base =
    title
      .normalize('NFKD')
      .toLocaleLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'item';
  let id = base;
  let suffix = 2;
  while (existingIds.has(id)) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }
  return id;
}

const fieldLabels: Record<CardDraftField, string> = {
  title: 'Title',
  category: 'Category',
  description: 'Short description',
  details: 'Details',
  tags: 'Tags',
  added: 'Date added',
  url: 'Resource link',
  imageSrc: 'Image path',
  imageAlt: 'Image description',
};

function draftField(path: string): CardDraftField | undefined {
  if (path.startsWith('image.src')) return 'imageSrc';
  if (path.startsWith('image.alt')) return 'imageAlt';
  const field = path.split(/[.[]/, 1)[0] as CardDraftField;
  return field in fieldLabels ? field : undefined;
}

export function buildCardUpdate(
  collection: Collection,
  draft: CardDraft,
  existingId?: string,
): { collection?: Collection; item?: CollectionItem; errors: CardDraftErrors } {
  const existingItem = collection.items.find((item) => item.id === existingId);
  const existingIds = new Set(
    collection.items.filter((item) => item.id !== existingId).map((item) => item.id),
  );
  const item: CollectionItem = {
    id: existingId || createItemId(draft.title.trim(), existingIds),
    title: draft.title.trim(),
    category: draft.category,
    description: draft.description.trim(),
    details: draft.details.trim(),
    tags: draft.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
    added: draft.added,
  };
  const url = draft.url.trim();
  if (url) item.url = url;
  const imageSrc = draft.imageSrc.trim();
  const imageAlt = draft.imageAlt.trim();
  if (imageSrc || imageAlt)
    item.image = {
      ...(existingItem?.image?.src === imageSrc ? existingItem.image : {}),
      src: imageSrc,
      alt: imageAlt,
    };

  const index = existingId
    ? collection.items.findIndex((entry) => entry.id === existingId)
    : collection.items.length;
  const items = existingId
    ? collection.items.map((entry) => (entry.id === existingId ? item : entry))
    : [...collection.items, item];
  const next = { ...collection, example: false, items };
  const prefix = `items[${index}].`;
  const errors: CardDraftErrors = {};
  for (const error of validateCollection(next)) {
    if (!error.startsWith(prefix)) continue;
    const [path, ...message] = error.slice(prefix.length).split(': ');
    const field = draftField(path);
    if (field && !errors[field]) errors[field] = `${fieldLabels[field]} ${message.join(': ')}`;
  }
  if (existingId && index < 0) errors.title = 'This card is no longer in the collection.';
  return Object.keys(errors).length ? { errors } : { collection: next, item, errors };
}
