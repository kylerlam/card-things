import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';

export function CopyLinkButton({ url, label }: { url: string; label: string }) {
  const [result, setResult] = useState({ url: '', status: 'idle' });
  const input = useRef<HTMLInputElement>(null);
  const status = result.url === url ? result.status : 'idle';

  useEffect(() => {
    if (status === 'manual') {
      input.current?.focus();
      input.current?.select();
    }
    if (status !== 'copied') return;
    const timer = window.setTimeout(() => setResult({ url: '', status: 'idle' }), 2500);
    return () => window.clearTimeout(timer);
  }, [status]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setResult({ url, status: 'copied' });
    } catch {
      setResult({ url, status: 'manual' });
    }
  }

  return (
    <div className="copy-link">
      <button className="copy-link-button" aria-label={label} onClick={copy}>
        <Icon name={status === 'copied' ? 'check' : 'link'} />
        <span className="copy-label">{status === 'copied' ? 'Link copied' : 'Copy link'}</span>
      </button>
      <span className="sr-only" role="status">
        {status === 'copied' ? 'Link copied to clipboard.' : ''}
      </span>
      {status === 'manual' ? (
        <div className="copy-fallback">
          <label>
            Copy this address
            <input
              ref={input}
              aria-label="Shareable link"
              value={url}
              readOnly
              onFocus={(event) => event.currentTarget.select()}
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}
