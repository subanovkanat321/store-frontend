export function WhatsappIcon({ size = 18 }: { size?: number }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size}>
      <path
        fill="currentColor"
        d="M12 3C7 3 3 6.6 3 11c0 2.4 1.2 4.6 3.1 6.1L5.5 21l4-2.1c.8.2 1.6.3 2.5.3 5 0 9-3.6 9-8.1S17 3 12 3z"
      />
    </svg>
  )
}

export function LogoMark() {
  return (
    <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="currentColor" />
      <path d="M9 12h14l-1.6 11.2a2 2 0 0 1-2 1.8h-6.8a2 2 0 0 1-2-1.8z" fill="#fff" />
      <path d="M12.5 12V10a3.5 3.5 0 0 1 7 0v2" fill="none" stroke="#fff" strokeWidth="2" />
    </svg>
  )
}
