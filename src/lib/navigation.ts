/**
 * Переход на чужой сайт (wa.me). Отдельной функцией, чтобы тесты могли подменить её:
 * в jsdom настоящий переход не работает.
 */
export function goTo(url: string): void {
  window.location.assign(url)
}
