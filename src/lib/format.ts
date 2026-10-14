const som = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 })

/** 1500 → «1 500 сом». Деньги в API — целые сомы. */
export function formatSom(amount: number): string {
  return `${som.format(amount)} сом`
}

const dateTime = new Intl.DateTimeFormat('ru-RU', {
  timeZone: 'Asia/Bishkek',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

/** Время из API (UTC, ISO-8601) → «10.10.2026 18:00» по Бишкеку, где бы ни был браузер. */
export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso)).replace(',', '')
}
