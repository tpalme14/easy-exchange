export default function StatusBadge({ value, type = 'status' }) {
  const className = `badge ${String(value || '').toLowerCase()}`;
  return (
    <span className={className}>
      {type}: {value}
    </span>
  );
}
