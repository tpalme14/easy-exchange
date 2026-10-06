export default function LoadingIndicator({ label = 'Loading...' }) {
  return (
    <p className="loading" role="status">
      {label}
    </p>
  );
}
