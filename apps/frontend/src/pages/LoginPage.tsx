import { useState, FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { HttpError } from '../shared/lib/http';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/';

  const { login, loading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const details =
        err instanceof HttpError
          ? (err.data as { details?: Record<string, string[]> } | null)?.details
          : undefined;
      const msg =
        err instanceof HttpError
          ? (err.data as { error?: string } | null)?.error ?? err.message
          : err instanceof Error
            ? err.message
            : 'Login failed';
      if (details) {
        setFieldErrors(details);
      }
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-stone-900 relative overflow-hidden flex-col justify-between p-12">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=900&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="relative z-10">
          <Link to="/" className="font-display text-2xl font-medium tracking-[0.15em] text-stone-50">
            LUMIÈRE
          </Link>
        </div>
        <div className="relative z-10">
          <blockquote className="font-display text-3xl text-stone-100 italic leading-snug mb-4">
            "The details are not the details.<br />They make the design."
          </blockquote>
          <cite className="text-stone-400 text-sm not-italic">— Charles Eames</cite>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 bg-stone-50">
        <div className="max-w-md w-full mx-auto">
          {/* Mobile logo */}
          <Link to="/" className="lg:hidden font-display text-xl tracking-widest text-stone-900 block mb-10">
            LUMIÈRE
          </Link>

          <div className="mb-8">
            <h1 className="font-display text-3xl font-medium text-stone-900 mb-2">
              Welcome back
            </h1>
            <p className="text-stone-500 text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-stone-900 font-medium underline underline-offset-2 hover:text-accent transition-colors">
                Sign up
              </Link>
            </p>
          </div>

          {/* Demo credentials hint */}
          <div className="bg-amber-50 border border-amber-200 px-4 py-3 mb-6 text-xs text-amber-800 space-y-1">
            <p className="font-medium">Demo credentials</p>
            <p>Customer: <span className="font-mono">demo@lumiere.com / Demo1234!</span></p>
            <p>Admin: <span className="font-mono">admin@lumiere.com / Admin123!</span></p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-5 text-sm animate-fade-in">
              <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs tracking-widest uppercase text-stone-500 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                placeholder="you@example.com"
                className={clsx(
                  'input',
                  fieldErrors.email && 'border-red-400 focus:border-red-500'
                )}
              />
              {fieldErrors.email && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.email[0]}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs tracking-widest uppercase text-stone-500">
                  Password
                </label>
                <a href="#" className="text-xs text-stone-500 hover:text-stone-900 transition-colors">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className={clsx(
                    'input pr-10',
                    fieldErrors.password && 'border-red-400'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 text-sm disabled:opacity-60 mt-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  Sign In
                </>
              )}
            </button>
          </form>

          <p className="text-xs text-center text-stone-400 mt-8">
            By signing in you agree to our{' '}
            <a href="#" className="underline hover:text-stone-700">Terms</a> and{' '}
            <a href="#" className="underline hover:text-stone-700">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
