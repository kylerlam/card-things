import type { SVGProps } from 'react';
import brand from '../content/brand';

const paths = {
  link: 'M10 13a5 5 0 0 0 7 .5l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7-.5l-3 3a5 5 0 0 0 7 7l2-2',
  check: 'm5 12 4 4L19 6',
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  heart:
    'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
  search: 'M21 21l-5.2-5.2M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z',
  arrow: 'M7 17 17 7M7 7h10v10',
  close: 'm6 6 12 12M6 18 18 6',
  chevron: 'm6 9 6 6 6-6',
  data: 'M4 7c0 2 3.6 3.5 8 3.5S20 9 20 7s-3.6-3.5-8-3.5S4 5 4 7Zm0 0v5c0 2 3.6 3.5 8 3.5s8-1.5 8-3.5V7M4 12v5c0 2 3.6 3.5 8 3.5s8-1.5 8-3.5v-5',
  download: 'M12 3v12m0 0 5-5m-5 5-5-5M5 21h14',
  upload: 'M12 16V4m0 0 5 5m-5-5L7 9M5 20h14',
  image: 'M4 5h16v14H4zM4 16l4-4 3 3 3-4 6 6M9 9h.01',
  plus: 'M12 5v14M5 12h14',
  edit: 'M4 20h4L19 9l-4-4L4 16v4Zm9-13 4 4',
  github:
    'M9 19c-4.3 1.3-4.3-2.2-6-2.7M15 22v-3.5c0-1 .1-1.4-.5-2 3.2-.4 6.5-1.6 6.5-7a5.4 5.4 0 0 0-1.5-3.8c.2-.8.2-2-.2-3.2 0 0-1.2-.4-3.8 1.5a13 13 0 0 0-7 0C5.9 1.1 4.7 1.5 4.7 1.5c-.4 1.2-.4 2.4-.2 3.2A5.4 5.4 0 0 0 3 8.5c0 5.4 3.3 6.6 6.5 7-.6.6-.6 1.2-.5 2V22',
} as const;

export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: keyof typeof paths }) {
  return (
    <svg
      data-icon={name}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}

export function Brand() {
  return (
    <span className="brand">
      <svg
        width="35"
        height="39"
        viewBox="0 0 40 44"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="23" height="27" rx="3" />
        <rect x="14" y="14" width="23" height="27" rx="3" />
      </svg>
      <span>{brand.name}</span>
    </span>
  );
}
