const TONE_COUNT = 6;

function hashText(text) {
  let hash = 2166136261;
  for (const character of text) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash;
}

export default function BookCover({ title = '', author = '', size = 'md' }) {
  const tone = hashText(`${title}|${author}`) % TONE_COUNT;

  return (
    <div className={`book-cover book-cover-${size} cover-tone-${tone}`} aria-hidden="true">
      <div className="book-cover-inner" data-title={title} data-author={author}>
        <span className="book-cover-rule" />
      </div>
    </div>
  );
}
