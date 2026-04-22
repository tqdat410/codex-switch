export function formatLocalDayBucket(value: number | Date) {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function eachLocalDayBucket(from: number, to: number) {
  const buckets: string[] = [];
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);

  while (cursor <= end) {
    buckets.push(formatLocalDayBucket(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return buckets;
}
