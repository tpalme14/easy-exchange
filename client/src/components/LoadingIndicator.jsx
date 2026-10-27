export default function LoadingIndicator({ label = 'Loading...' }) {
  return (
    <p className="loading" role="status">
      <span className="spinner" aria-hidden="true" />
      {label}
    </p>
  );
}
