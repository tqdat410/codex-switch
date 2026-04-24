import type { CSSProperties } from 'react';
import type { LabAccountItem } from '../../lib/quota-lab-view-model';
import {
  formatQuotaPercent,
  getAccountState,
  getDominantTone,
} from './quota-lab-overlay';

interface QuotaLabFallbackProps {
  items: readonly LabAccountItem[];
}

type QuotaMeterStyle = CSSProperties & {
  '--quota-level': string;
  '--quota-weekly-level': string;
};

export function QuotaLabFallback({ items }: Readonly<QuotaLabFallbackProps>) {
  if (items.length === 0) {
    return (
      <div
        className="quota-lab-fallback quota-lab-fallback--empty"
        role="status"
      >
        No accounts to display.
      </div>
    );
  }

  return (
    <section className="quota-lab-fallback" aria-label="Account quota fallback">
      <p className="quota-lab-fallback__notice" role="status">
        WebGL is unavailable. Showing readable account summaries.
      </p>
      <ol className="quota-lab-fallback__grid">
        {items.map((item) => {
          const accountState = getAccountState(item);
          const labelId = `quota-fallback-${item.layout.index}`;
          const tone = getDominantTone(item);

          return (
            <li key={item.name} className="quota-lab-fallback__item">
              <article
                className={`quota-lab-fallback__tube quota-lab-fallback__tube--${tone}`}
                aria-labelledby={labelId}
              >
                <div
                  className="quota-lab-fallback__tube-shell"
                  aria-hidden="true"
                >
                  <span className="quota-lab-fallback__tube-cap quota-lab-fallback__tube-cap--top" />
                  <span
                    className="quota-lab-fallback__tube-fill quota-lab-fallback__tube-fill--five-hour"
                    style={quotaLevelStyle(item.fiveHour.percent)}
                  />
                  <span
                    className="quota-lab-fallback__tube-fill quota-lab-fallback__tube-fill--weekly"
                    style={quotaLevelStyle(item.weekly.percent)}
                  />
                  <span className="quota-lab-fallback__tube-cap quota-lab-fallback__tube-cap--bottom" />
                </div>

                <div className="quota-lab-fallback__content">
                  <header className="quota-lab-fallback__header">
                    <div>
                      <h2 id={labelId} className="quota-lab-fallback__name">
                        {item.name}
                      </h2>
                      <p className="quota-lab-fallback__meta">
                        {item.email} / {item.plan}
                      </p>
                    </div>
                    {item.isActive ? (
                      <span
                        className="quota-lab-fallback__active"
                        aria-label="Active account"
                      >
                        Active
                      </span>
                    ) : null}
                  </header>

                  <dl className="quota-lab-fallback__readouts">
                    <QuotaReadout
                      label="5h"
                      percent={item.fiveHour.percent}
                      reset={item.fiveHour.resetLabel}
                    />
                    <QuotaReadout
                      label="Weekly"
                      percent={item.weekly.percent}
                      reset={item.weekly.resetLabel}
                    />
                  </dl>

                  <p
                    className={`quota-lab-fallback__state quota-lab-fallback__state--${accountState.tone}`}
                  >
                    {accountState.label}
                  </p>
                  <p className="quota-lab-fallback__updated">
                    {item.updatedLabel}
                  </p>
                  {item.errorMessage ? (
                    <p className="quota-lab-fallback__error" role="status">
                      {item.errorMessage}
                    </p>
                  ) : null}
                </div>
              </article>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function QuotaReadout({
  label,
  percent,
  reset,
}: Readonly<{
  label: string;
  percent: number | null;
  reset: string;
}>) {
  return (
    <div className="quota-lab-fallback__readout">
      <dt className="quota-lab-fallback__readout-label">{label}</dt>
      <dd className="quota-lab-fallback__readout-value">
        {formatQuotaPercent(percent)}
      </dd>
      <dd className="quota-lab-fallback__readout-reset">{reset}</dd>
    </div>
  );
}

function quotaLevelStyle(percent: number | null): QuotaMeterStyle {
  const fill = Math.max(0, Math.min(1, (percent ?? 0) / 100));

  return {
    '--quota-level': `${Math.round(fill * 86)}px`,
    '--quota-weekly-level': `${Math.round(fill * 36)}px`,
  };
}
