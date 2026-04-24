import type { LabAccountItem, QuotaTone } from '../../lib/quota-lab-view-model';

interface QuotaLabOverlayProps {
  items: readonly LabAccountItem[];
  pending?: boolean;
}

interface AccountState {
  label: string;
  tone: QuotaTone;
}

export function QuotaLabOverlay({
  items,
  pending = false,
}: Readonly<QuotaLabOverlayProps>) {
  return (
    <ol className="quota-lab-overlay" aria-label="Account quota details">
      {items.map((item) => {
        const accountState = getAccountState(item);
        const labelId = `quota-overlay-${item.layout.index}`;
        const tone = getDominantTone(item);

        return (
          <li
            key={item.name}
            className={`quota-lab-overlay__item quota-lab-overlay__item--${tone}`}
          >
            <article
              className="quota-lab-overlay__card"
              aria-labelledby={labelId}
            >
              <header className="quota-lab-overlay__header">
                <div className="quota-lab-overlay__identity">
                  <h2 id={labelId} className="quota-lab-overlay__name">
                    {item.name}
                  </h2>
                  {item.isActive ? (
                    <span
                      className="quota-lab-overlay__active"
                      aria-label="Active account"
                    >
                      Active
                    </span>
                  ) : null}
                </div>
                <p className="quota-lab-overlay__meta">
                  <span>{item.email}</span>
                  <span aria-hidden="true">/</span>
                  <span>{item.plan}</span>
                </p>
              </header>

              <dl className="quota-lab-overlay__quotas">
                <QuotaDetail
                  label="5h"
                  percent={item.fiveHour.percent}
                  reset={item.fiveHour.resetLabel}
                />
                <QuotaDetail
                  label="Weekly"
                  percent={item.weekly.percent}
                  reset={item.weekly.resetLabel}
                />
              </dl>

              <div className="quota-lab-overlay__status">
                <span
                  className={`quota-lab-overlay__state quota-lab-overlay__state--${accountState.tone}`}
                >
                  {accountState.label}
                </span>
                <span className="quota-lab-overlay__updated">
                  {pending ? 'Updating quota data' : item.updatedLabel}
                </span>
                {item.errorMessage ? (
                  <span className="quota-lab-overlay__error" role="status">
                    {item.errorMessage}
                  </span>
                ) : null}
              </div>
            </article>
          </li>
        );
      })}
    </ol>
  );
}

function QuotaDetail({
  label,
  percent,
  reset,
}: Readonly<{
  label: string;
  percent: number | null;
  reset: string;
}>) {
  return (
    <div className="quota-lab-overlay__quota">
      <dt className="quota-lab-overlay__quota-label">{label}</dt>
      <dd className="quota-lab-overlay__quota-value">
        {formatQuotaPercent(percent)}
      </dd>
      <dd className="quota-lab-overlay__quota-reset">{reset}</dd>
    </div>
  );
}

export function formatQuotaPercent(percent: number | null) {
  return percent === null ? 'No data' : `${percent}%`;
}

export function getAccountState(item: LabAccountItem): AccountState {
  if (item.requiresReauth) {
    return { label: 'Re-auth required', tone: 'reauth' };
  }

  if (item.errorMessage) {
    return { label: 'Quota refresh error', tone: 'danger' };
  }

  if (item.fiveHour.percent === null && item.weekly.percent === null) {
    return { label: 'Quota data pending', tone: 'empty' };
  }

  return { label: 'Quota data current', tone: 'healthy' };
}

export function getDominantTone(item: LabAccountItem): QuotaTone {
  if (item.requiresReauth) {
    return 'reauth';
  }

  if (item.errorMessage) {
    return 'danger';
  }

  const tones = [item.fiveHour.tone, item.weekly.tone];
  if (tones.includes('danger')) {
    return 'danger';
  }

  if (tones.includes('warn')) {
    return 'warn';
  }

  if (tones.every((tone) => tone === 'empty')) {
    return 'empty';
  }

  return 'healthy';
}
