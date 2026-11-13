import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="stars flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-6xl" aria-hidden>
        🛰️
      </p>
      <h1 className="font-display text-3xl font-bold">Lost signal</h1>
      <p className="max-w-md text-muted">
        We could not find that page. It may have drifted off into deep space.
      </p>
      <Link to="/" className="btn-primary">
        Return to base
      </Link>
    </div>
  );
}
