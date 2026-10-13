import { useEffect, useState, type ReactNode } from 'react';
import { getJson } from '../api/client.js';

type CapabilityCardProps<T> = {
  title: string;
  description: string;
  path: string;
  emptyMessage: string;
  mapItems: (payload: T) => Array<Record<string, unknown> | string | number>;
  renderItem: (item: Record<string, unknown> | string | number, index: number) => ReactNode;
};

export function CapabilityCard<T>({
  title,
  description,
  path,
  emptyMessage,
  mapItems,
  renderItem,
}: CapabilityCardProps<T>) {
  const [items, setItems] = useState<Array<Record<string, unknown> | string | number>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    setIsLoading(true);
    setError(null);

    void getJson<T>(path)
      .then((payload) => {
        if (!active) return;
        setItems(mapItems(payload));
      })
      .catch(() => {
        if (!active) return;
        setError(`Unable to load ${title.toLowerCase()}.`);
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [path, title]);

  const heading = <h2 className="h4">{title}</h2>;

  if (isLoading) {
    return (
      <section className="card h-100">
        <div className="card-body">
          {heading}
          <p>{description}</p>
          <p role="status">Loading {title.toLowerCase()}...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card h-100">
        <div className="card-body">
          {heading}
          <p>{description}</p>
          <div role="alert">{error}</div>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="card h-100">
        <div className="card-body">
          {heading}
          <p>{description}</p>
          <p>{emptyMessage}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="card h-100">
      <div className="card-body">
        {heading}
        <p>{description}</p>
        <ul className="list-group list-group-flush">
          {items.map((item, index) => (
            <li key={typeof item === 'string' || typeof item === 'number' ? `${title}-${index}` : `${title}-${index}-${JSON.stringify(item)}`} className="list-group-item">
              {renderItem(item, index)}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
