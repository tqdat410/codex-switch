import type {
  AccountRecord,
  QuotaCacheRow,
  QuotaDisplaySource,
  QuotaErrorSummary,
} from '@codex-switch/shared';
import type { FetchQuotaReason } from '../core/quota-orchestrator.js';

const BAR_WIDTH = 20;
const EMPTY_BAR_CELL = '░';
const FILLED_BAR_CELL = '█';
const ANSI_BOLD = '\u001B[1m';
const ANSI_BOLD_OFF = '\u001B[22m';
const ANSI_DIM = '\u001B[2m';
const ANSI_RESET_INTENSITY = '\u001B[22m';
const ANSI_PATTERN = new RegExp(`${ANSI_BOLD.slice(0, 2).replace('[', '\\[')}[0-9;]*m`, 'g');

export interface ListDisplayRow extends AccountRecord {
  isActive: boolean;
  latestQuota: QuotaCacheRow | null;
  requiresReauth: boolean;
  quotaReason: FetchQuotaReason;
  quotaSource: QuotaDisplaySource | null;
  quotaError: QuotaErrorSummary | null;
}

export interface FormatListRowsOptions {
  private?: boolean;
}

export function formatListRows(rows: ListDisplayRow[], options: FormatListRowsOptions = {}) {
  return formatTable(rows.map((row) => formatListRow(row, options)));
}

function formatListRow(row: ListDisplayRow, options: FormatListRowsOptions) {
  const marker = row.isActive ? '*' : ' ';
  const email = options.private && row.email ? maskPrivateEmail(row.email) : row.email;
  const identity = [row.plan, email].filter(Boolean).join(' / ') || 'no plan/email';
  const quota = row.latestQuota;
  const status = formatQuotaStatus(row);
  const account = [
    formatBold(`${marker} ${row.name}`),
    formatDim(`(${identity})`),
    status,
  ]
    .filter(Boolean)
    .join('\n');

  return [
    account,
    formatQuotaLimit(quota?.fiveHourPercent ?? null, quota?.fiveHourResetAt ?? null),
    formatQuotaLimit(quota?.weeklyPercent ?? null, quota?.weeklyResetAt ?? null),
  ];
}

function maskPrivateEmail(email: string) {
  return [...email].map((character) => (character === '@' ? character : EMPTY_BAR_CELL)).join('');
}

export function formatQuotaBar(label: string, percent: number | null) {
  return `${label} ${formatBarWithPercent(percent)}`;
}

function formatQuotaLimit(percent: number | null, resetAt: number | null) {
  const lines = [formatBarWithPercent(percent)];
  if (resetAt) {
    lines.push(`(resets ${formatResetAt(resetAt)})`);
  }

  return lines.join('\n');
}

function formatBarWithPercent(percent: number | null) {
  if (percent === null || !Number.isFinite(percent)) {
    return `[${formatDim(EMPTY_BAR_CELL.repeat(BAR_WIDTH))}] ${formatDim('--')}`;
  }

  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const filled = Math.round((clamped / 100) * BAR_WIDTH);
  const filledBar = FILLED_BAR_CELL.repeat(filled);
  const emptyBar = formatDim(EMPTY_BAR_CELL.repeat(BAR_WIDTH - filled));

  return `[${filledBar}${emptyBar}] ${formatBold(`${clamped}%`)}`;
}

function formatQuotaStatus(row: ListDisplayRow) {
  const pieces = [];

  if (row.requiresReauth) {
    pieces.push(formatBold('reauth required'));
  }

  if (row.latestQuota?.staleReason && row.latestQuota.staleReason !== 'requires_reauth') {
    pieces.push(formatBold(`stale:${row.latestQuota.staleReason}`));
  }

  if (row.quotaError) {
    pieces.push(formatBold(`${row.quotaError.code}: ${row.quotaError.message}`));
  }

  return pieces.join(' | ');
}

function formatResetAt(value: number) {
  const reset = new Date(value);
  const now = new Date();
  const time = `${String(reset.getHours()).padStart(2, '0')}:${String(reset.getMinutes()).padStart(2, '0')}`;

  if (isSameLocalDay(reset, now)) {
    return time;
  }

  return `${time} on ${reset.getDate()} ${formatMonth(reset)}`;
}

function formatBold(value: string) {
  return `${ANSI_BOLD}${value}${ANSI_BOLD_OFF}`;
}

function formatDim(value: string) {
  return value ? `${ANSI_DIM}${value}${ANSI_RESET_INTENSITY}` : '';
}

function isSameLocalDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function formatMonth(value: Date) {
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][
    value.getMonth()
  ] ?? '';
}

function formatTable(rows: string[][]) {
  const header = [`Account (${rows.length})`, '5h Limit', 'Weekly Limit'].map((value) =>
    formatBold(value),
  );
  const table = [header, ...rows];
  const widths = header.map((_, index) =>
    Math.max(...table.map((row) => maxVisibleLineLength(row[index] ?? ''))),
  );
  const topBorder = formatBorder('╭', '┬', '╮', widths);
  const separator = formatBorder('├', '┼', '┤', widths);
  const bottomBorder = formatBorder('╰', '┴', '╯', widths);
  const renderedRows = table.map((row, index) => {
    const rendered = formatTableRow(row, widths);
    return index === 0 ? `${rendered}\n${separator}` : rendered;
  });

  return [topBorder, ...renderedRows, bottomBorder].join('\n');
}

function formatTableRow(row: string[], widths: number[]) {
  const lines = row.map((cell) => cell.split('\n'));
  const height = Math.max(...lines.map((cellLines) => cellLines.length));
  const renderedLines = [];

  for (let lineIndex = 0; lineIndex < height; lineIndex += 1) {
    renderedLines.push(
      lines
        .map((cellLines, cellIndex) => ` ${padVisible(cellLines[lineIndex] ?? '', widths[cellIndex] ?? 0)} `)
        .join('│'),
    );
  }

  return renderedLines.map((line) => `│${line}│`).join('\n');
}

function formatBorder(left: string, middle: string, right: string, widths: number[]) {
  return `${left}${widths.map((width) => '─'.repeat(width + 2)).join(middle)}${right}`;
}

function padVisible(value: string, width: number) {
  return `${value}${' '.repeat(Math.max(0, width - visibleLength(value)))}`;
}

function maxVisibleLineLength(value: string) {
  return Math.max(...value.split('\n').map(visibleLength));
}

function visibleLength(value: string) {
  return value.replace(ANSI_PATTERN, '').length;
}
