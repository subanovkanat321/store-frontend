import type { ReactNode } from 'react'

/** Поле формы: подпись, само поле и ошибка под ним (из ответа 422). */
export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="form__field">
      <span>{label}</span>
      {children}
      {error && <small className="form__error">{error}</small>}
    </label>
  )
}

/** Ошибка всей формы: конфликт, лимит, сеть. role=alert — экранный диктор прочитает её сразу. */
export function FormError({ message }: { message: string | undefined }) {
  return message ? (
    <p className="form-error" role="alert">
      {message}
    </p>
  ) : null
}
