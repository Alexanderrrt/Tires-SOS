export default function PirelliBadge({ className = "", compact = false }) {
  return (
    <span className={`pirelli-badge ${compact ? "pirelli-badge--compact" : ""} ${className}`.trim()}>
      <img src="/brands/pirelli.svg" alt="Pirelli" />
    </span>
  );
}
