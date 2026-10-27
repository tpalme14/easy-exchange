export default function StatusBadge({ value, type = 'status' }) {
  const tone = String(value || '')
    .toLowerCase()
    .replace(/\s+/g, '-');

  return (
    <span className={`badge ${tone}`}>
      <span className="badge-label">{type}:</span> {value}
    </span>
  );
}
