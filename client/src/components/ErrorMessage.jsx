export default function ErrorMessage({ message }) {
  if (!message) {
    return null;
  }

  return (
    <p className="notice error" role="alert">
      {message}
    </p>
  );
}
