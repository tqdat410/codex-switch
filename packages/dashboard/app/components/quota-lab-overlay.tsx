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
  const item = getActiveItem(items);

  if (!item) {
    return (
      <section
        className="quota-lab-overlay quota-lab-overlay--empty"
        role="status"
      >
        No active account quota data.
      </section>
    );
  }

  const accountState = getAccountState(item);
  const labelId = `quota-overlay-${item.layout.index}`;
  const tone = getDominantTone(item);

  return (
    <section
      className={`quota-lab-overlay quota-lab-overlay--${tone}`}
      aria-label="Active account quota telemetry"
    >
      <article className="quota-lab-overlay__panel" aria-labelledby={labelId}>
        <header className="quota-lab-overlay__header">
          <div className="quota-lab-overlay__identity">
            <div className="quota-lab-overlay__identity-copy">
              <h2 id={labelId} className="quota-lab-overlay__name">
                {item.name}
              </h2>
              <p className="quota-lab-overlay__meta">
                <span>{item.email}</span>
                <span aria-hidden="true">/</span>
                <span>{item.plan}</span>
              </p>
            </div>
            <span
              className="quota-lab-overlay__active"
              aria-label={item.isActive ? 'Active account' : 'Displayed account'}
            >
              {item.isActive ? 'Active' : 'Displayed'}
            </span>
          </div>
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
    </section>
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

function getActiveItem(items: readonly LabAccountItem[]) {
  return items.find((item) => item.isActive) ?? items[0] ?? null;
}
