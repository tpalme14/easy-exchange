import { BOOK_CONDITIONS, BOOK_STATUSES } from '../utils/format.js';

export default function BookForm({
  values,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
  busy,
  error,
  includeAvailability = true
}) {
  function handleChange(event) {
    const { name, value } = event.target;
    onChange((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit();
  }

  const invalid =
    !values.title?.trim() || !values.author?.trim() || !values.condition;

  return (
    <form className="form wide" onSubmit={handleSubmit}>
      {error ? (
        <p className="notice error" role="alert">
          {error}
        </p>
      ) : null}
      <label>
        Title <span className="required">(required)</span>
        <input
          name="title"
          value={values.title}
          onChange={handleChange}
          required
        />
      </label>
      <label>
        Author <span className="required">(required)</span>
        <input
          name="author"
          value={values.author}
          onChange={handleChange}
          required
        />
      </label>
      <label>
        Description
        <textarea
          name="description"
          rows="4"
          value={values.description}
          onChange={handleChange}
        />
      </label>
      <label>
        Condition <span className="required">(required)</span>
        <select
          name="condition"
          value={values.condition}
          onChange={handleChange}
          required
        >
          <option value="">Select condition</option>
          {BOOK_CONDITIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      {includeAvailability ? (
        <label>
          Availability
          <select name="status" value={values.status} onChange={handleChange}>
            {BOOK_STATUSES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <div className="button-row">
        <button type="submit" disabled={busy || invalid}>
          {busy ? 'Saving...' : submitLabel}
        </button>
        <button type="button" className="secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>
    </form>
  );
}
