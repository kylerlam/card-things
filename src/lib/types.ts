export interface CollectionItem {
  id: string;
  title: string;
  category: string;
  description: string;
  details: string;
  tags: string[];
  added: string;
  image: { src: string; position?: string; size?: string; alt: string };
  url?: string;
}

export interface Collection {
  title: string;
  description: string;
  example: boolean;
  categories: { id: string; label: string; color: string }[];
  items: CollectionItem[];
}
