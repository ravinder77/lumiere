import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, AlertCircle, Check, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { HttpError } from '../shared/lib/http';

interface PasswordRule {
  label: string;
  test: (pw: string) => boolean;
}

const PW_RULES: PasswordRule[] = [
  { label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { label: 'One uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
  { label: 'One number', test: (pw) => /[0-9]/.test(pw) },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, loading } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const pwRulesPassed = PW_RULES.every((r) => r.test(password));
  const pwMatch = password === confirmPw && confirmPw.length > 0;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!pwRulesPassed) { setError('Password does not meet requirements'); return; }
    if (!pwMatch) { setError('Passwords do not match'); return; }

    try {
      await register(name, email, password);
      toast.success('Account created! Welcome to LUMIÈRE.');
      navigate('/');
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
            : 'Registration failed';
      if (details) setFieldErrors(details);
      else setError(msg);
    }
  };

  const field = (key: string) => ({
    onBlur: () => setTouched((t) => ({ ...t, [key]: true })),
    'data-touched': touched[key],
  });

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-stone-900 relative overflow-hidden flex-col justify-between p-12">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=900&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="relative z-10">
          <Link to="/" className="font-display text-2xl font-medium tracking-[0.15em] text-stone-50">
            LUMIÈRE
          </Link>
        </div>
        <div className="relative z-10 space-y-6">
          {[
            { title: 'Order history', desc: 'Track all your past and current orders' },
            { title: 'Faster checkout', desc: 'Saved details, one-click purchasing' },
            { title: 'Exclusive access', desc: 'Early access to new arrivals and sales' },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-accent/20 border border-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check size={11} className="text-accent" />
              </div>
              <div>
                <p className="text-stone-100 text-sm font-medium">{item.title}</p>
                <p className="text-stone-500 text-xs">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 bg-stone-50 overflow-y-auto">
        <div className="max-w-md w-full mx-auto">
          <Link to="/" className="lg:hidden font-display text-xl tracking-widest text-stone-900 block mb-10">
            LUMIÈRE
          </Link>

          <div className="mb-8">
            <h1 className="font-display text-3xl font-medium text-stone-900 mb-2">
              Create account
            </h1>
            <p className="text-stone-500 text-sm">
              Already have one?{' '}
              <Link to="/login" className="text-stone-900 font-medium underline underline-offset-2 hover:text-accent transition-colors">
                Sign in
              </Link>
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-5 text-sm animate-fade-in">
              <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-xs tracking-widest uppercase text-stone-500 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
                placeholder="Jane Smith"
                {...field('name')}
                className={clsx('input', fieldErrors.name && 'border-red-400')}
              />
              {fieldErrors.name && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.name[0]}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs tracking-widest uppercase text-stone-500 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                placeholder="you@example.com"
                {...field('email')}
                className={clsx('input', fieldErrors.email && 'border-red-400')}
              />
              {fieldErrors.email && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.email[0]}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs tracking-widest uppercase text-stone-500 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  placeholder="Create a password"
                  {...field('password')}
                  className="input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password strength rules */}
              {password.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {PW_RULES.map((rule) => {
                    const passed = rule.test(password);
                    return (
                      <li key={rule.label} className={clsx(
                        'flex items-center gap-1.5 text-xs transition-colors',
                        passed ? 'text-green-600' : 'text-stone-400'
                      )}>
                        {passed
                          ? <Check size={11} className="text-green-500" />
                          : <X size={11} className="text-stone-300" />}
                        {rule.label}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-xs tracking-widest uppercase text-stone-500 mb-1.5">
                Confirm Password
              </label>
              <input
                type={showPw ? 'text' : 'password'}
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                autoComplete="new-password"
                required
                placeholder="Repeat your password"
                {...field('confirmPw')}
                className={clsx(
                  'input',
                  confirmPw.length > 0 && !pwMatch && 'border-red-400',
                  confirmPw.length > 0 && pwMatch && 'border-green-400'
                )}
              />
              {confirmPw.length > 0 && !pwMatch && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 text-sm disabled:opacity-60 mt-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account…
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  Create Account
                </>
              )}
            </button>
          </form>

          <p className="text-xs text-center text-stone-400 mt-8">
            By creating an account you agree to our{' '}
            <a href="#" className="underline hover:text-stone-700">Terms</a> and{' '}
            <a href="#" className="underline hover:text-stone-700">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
