import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState.jsx';

export default function NotFoundPage() {
  return (
    <section>
      <div className="page-header">
        <h2>Page not found</h2>
      </div>
      <EmptyState
        title="This page seems to have been checked out"
        message="The page you requested does not exist."
        action={
          <Link className="button" to="/">
            Return to Easy Exchange
          </Link>
        }
      />
    </section>
  );
}
