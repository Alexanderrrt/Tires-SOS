// Custom automotive line-icon set, one consistent spec: 24x24, 1.75 stroke,
// currentColor. Replaces emoji so the UI reads as drawn, not typed.

const GLYPHS = {
  // --- services ---
  tire: (
    <>
      <circle cx="12" cy="12" r="9.5" />
      <circle cx="12" cy="12" r="6.5" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  wrench: (
    <path d="M15 5.5a3.8 3.8 0 0 0-5 5L3.8 16.7a2 2 0 0 0 0 2.8l.7.7a2 2 0 0 0 2.8 0L13.5 14a3.8 3.8 0 0 0 5-5l-2.2 2.2-2-.5-.5-2L15 5.5z" />
  ),
  alignment: (
    <>
      <circle cx="12" cy="12" r="5.5" />
      <path d="M12 2v3.5M12 18.5V22" />
      <path d="M4 7l2.4 1.6M19.9 7l-2.4 1.6M4 17l2.4-1.6M19.9 17l-2.4-1.6" />
    </>
  ),
  brakes: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
      <path d="M16.5 7.2A2 2 0 0 1 18.5 9v6a2 2 0 0 1-2 2" />
      <circle cx="12" cy="6.4" r="0.5" fill="currentColor" stroke="none" />
      <circle cx="7.2" cy="14.4" r="0.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="17.6" r="0.5" fill="currentColor" stroke="none" />
    </>
  ),
  oil: (
    <>
      <path d="M12 3.2c3.4 3.8 5.6 6.6 5.6 9.3A5.6 5.6 0 0 1 6.4 12.5C6.4 9.8 8.6 7 12 3.2z" />
      <path d="M14.7 13.2a2.7 2.7 0 0 1-2.4 2.3" />
    </>
  ),
  battery: (
    <>
      <rect x="3" y="8" width="18" height="10" rx="1.5" />
      <path d="M7 8V6h3v2M14 8V6h3v2" />
      <path d="M8 13h2.5M9.25 11.75v2.5" />
      <path d="M13.5 13H16" />
    </>
  ),
  rim: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2.3" />
      <path d="M12 4.2v5.3M19 9l-4.7 3M16.4 19.4L13.4 14M7.6 19.4L10.6 14M5 9l4.7 3" />
    </>
  ),
  // --- ui glyphs ---
  phone: (
    <path d="M6.4 3h3l1.4 3.8-2 1.4a11 11 0 0 0 5 5l1.4-2 3.8 1.4v3a2 2 0 0 1-2.1 2A16 16 0 0 1 4.4 5.1 2 2 0 0 1 6.4 3z" />
  ),
  pin: (
    <>
      <path d="M12 21s-6-5.2-6-10a6 6 0 0 1 12 0c0 4.8-6 10-6 10z" />
      <circle cx="12" cy="11" r="2.2" />
    </>
  ),
  instagram: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="16.8" cy="7.2" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  arrow: <path d="M5 12h13M12.5 6l6 6-6 6" />,
};

export default function Icon({ name, className = "" }) {
  const glyph = GLYPHS[name];
  if (!glyph) return null;
  return (
    <svg
      className={`icon ${className}`.trim()}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {glyph}
    </svg>
  );
}
