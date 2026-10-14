import { formatDateTime, formatSom } from './format'

test('сомы с разделителем тысяч', () => {
  expect(formatSom(1500)).toMatch(/^1\s500 сом$/)
  expect(formatSom(0)).toBe('0 сом')
})

test('время по Бишкеку (UTC+6), где бы ни был браузер', () => {
  expect(formatDateTime('2026-10-10T12:00:00Z')).toBe('10.10.2026 18:00')
})
