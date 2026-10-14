import { useEffect, type RefObject } from 'react'

/**
 * Показать ошибку, которую вернул сервер. На телефоне кнопка «Отправить» внизу, а ошибки
 * под полями и общая плашка — выше, за краем экрана: без этого нажатие выглядело бы так,
 * будто ничего не произошло (ISSUE-001). Прокручиваем к первому неверному полю и ставим
 * в него курсор; если ошибка общая (товар раскупили, лимит) — к её плашке.
 */
export function useRevealError(error: unknown, container: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const root = container.current
    if (!error || !root) {
      return
    }
    const field = root
      .querySelector('.form__error')
      ?.closest('label')
      ?.querySelector<HTMLElement>('input, textarea, select')
    const target = field ?? root.querySelector<HTMLElement>('[role="alert"]')
    if (!target) {
      return
    }
    // center, а не start: прилипшая шапка не закроет поле
    target.scrollIntoView?.({ block: 'center', behavior: 'smooth' })
    field?.focus({ preventScroll: true })
  }, [error, container])
}
