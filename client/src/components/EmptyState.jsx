export default function EmptyState({ title, message, action }) {
  return (
    <div className="empty-state">
      <svg
        className="empty-state-icon"
        viewBox="0 0 48 48"
        width="48"
        height="48"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M8 10c5-2 11-2 16 2v26c-5-4-11-4-16-2V10Zm32 0c-5-2-11-2-16 2v26c5-4 11-4 16-2V10Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      </svg>
      {title ? <p className="empty-state-title">{title}</p> : null}
      <p className="empty-state-message">{message}</p>
      {action ? <div className="empty-state-action">{action}</div> : null}
    </div>
  );
}
