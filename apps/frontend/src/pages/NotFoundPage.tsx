import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center">
      <p className="font-mono text-stone-300 text-8xl font-bold tracking-tight mb-4">404</p>
      <h1 className="font-display text-3xl font-medium text-stone-900 mb-3">Page not found</h1>
      <p className="text-stone-400 max-w-sm mb-8 leading-relaxed">
        The page you're looking for has moved, been removed, or never existed.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={() => navigate(-1)} className="btn-secondary gap-2">
          <ArrowLeft size={15} /> Go Back
        </button>
        <Link to="/" className="btn-primary gap-2">
          Home
        </Link>
        <Link to="/products" className="btn-secondary gap-2">
          <Search size={15} /> Browse Shop
        </Link>
      </div>
    </div>
  );
}
