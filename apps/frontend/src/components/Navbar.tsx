import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, Menu, X, User, LogOut, Package, ChevronDown, Heart } from 'lucide-react';
import { useWishlistStore } from '../store/wishlistStore';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import clsx from 'clsx';

export default function Navbar() {
  const [scrolled, setScrolled]       = useState(false);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { cart, toggleCart }   = useCartStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { load: loadWishlist, ids: wishlistIds } = useWishlistStore();
  const location  = useLocation();
  const navigate  = useNavigate();
  const itemCount = cart?.itemCount ?? 0;

  // Load wishlist when authenticated
  useEffect(() => { if (isAuthenticated) loadWishlist(); }, [isAuthenticated, loadWishlist]);

  // Scroll detection
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); setUserMenuOpen(false); }, [location]);

  // Close user dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  const navLinks = [
    { to: '/products', label: 'Shop' },
    { to: '/products?category=electronics', label: 'Electronics' },
    { to: '/products?category=clothing', label: 'Clothing' },
    { to: '/products?category=home', label: 'Home' },
  ];

  return (
    <header
      className={clsx(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-stone-50/95 backdrop-blur-sm border-b border-stone-200 shadow-sm'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <span className="font-display text-xl font-medium tracking-[0.15em] text-stone-900">
              LUMIÈRE
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm text-stone-500 hover:text-stone-900 transition-colors tracking-wide"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            {/* Search */}
            <Link to="/products" className="btn-ghost p-2.5">
              <Search size={18} />
            </Link>

            {/* Cart */}
            <button
              onClick={toggleCart}
              className="btn-ghost p-2.5 relative"
              aria-label="Cart"
            >
              <ShoppingBag size={18} />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-stone-900 text-stone-50 text-[10px] font-medium flex items-center justify-center rounded-full px-1">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </button>

            {/* Auth area */}
            {isAuthenticated && user ? (
              /* User dropdown */
              <div className="relative hidden md:block" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={clsx(
                    'btn-ghost px-3 py-2 flex items-center gap-1.5 text-sm',
                    userMenuOpen && 'bg-stone-100 text-stone-900'
                  )}
                >
                  <div className="w-6 h-6 bg-stone-900 text-stone-50 rounded-full flex items-center justify-center text-[10px] font-medium flex-shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[80px] truncate">{user.name.split(' ')[0]}</span>
                  <ChevronDown size={13} className={clsx('transition-transform', userMenuOpen && 'rotate-180')} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-stone-200 shadow-lg z-50 animate-fade-in">
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-stone-100">
                      <p className="text-sm font-medium text-stone-900 truncate">{user.name}</p>
                      <p className="text-xs text-stone-400 truncate">{user.email}</p>
                      {user.role === 'ADMIN' && (
                        <span className="mt-1 inline-block px-1.5 py-0.5 text-[10px] bg-accent/10 text-accent font-medium">
                          Admin
                        </span>
                      )}
                    </div>

                    {/* Menu items */}
                    <Link
                      to="/account"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                    >
                      <User size={14} />
                      My Profile
                    </Link>
                    <Link
                      to="/account"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                    >
                      <Package size={14} />
                      Order History
                    </Link>
                    <Link
                      to="/wishlist"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center justify-between gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                    >
                      <span className="flex items-center gap-2.5"><Heart size={14} /> Wishlist</span>
                      {wishlistIds.size > 0 && (
                        <span className="text-xs bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded-full">{wishlistIds.size}</span>
                      )}
                    </Link>
                    <Link
                      to="/track-order"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                    >
                      <Package size={14} />
                      Track Order
                    </Link>

                    <div className="border-t border-stone-100 mt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={14} />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Sign in / Register links */
              <div className="hidden md:flex items-center gap-1">
                <Link to="/login" className="btn-ghost px-3 py-2 text-sm">
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary px-4 py-2 text-sm">
                  Register
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden btn-ghost p-2.5"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-stone-50 border-t border-stone-200 animate-fade-in">
          <nav className="flex flex-col px-4 py-2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="py-3 text-sm text-stone-700 border-b border-stone-100 last:border-0 tracking-wide"
              >
                {link.label}
              </Link>
            ))}

            {/* Auth section in mobile */}
            <div className="pt-3 pb-2 border-t border-stone-200 mt-1 space-y-2">
              {isAuthenticated && user ? (
                <>
                  <div className="flex items-center gap-2 py-1">
                    <div className="w-7 h-7 bg-stone-900 text-stone-50 rounded-full flex items-center justify-center text-xs font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-stone-800">{user.name}</p>
                      <p className="text-xs text-stone-400">{user.email}</p>
                    </div>
                  </div>
                  <Link to="/account" className="flex items-center gap-2 py-2 text-sm text-stone-700">
                    <User size={14} /> My Account
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 py-2 text-sm text-red-600 w-full"
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </>
              ) : (
                <div className="flex gap-3">
                  <Link to="/login" className="btn-secondary flex-1 text-center py-2.5 text-sm">
                    Sign In
                  </Link>
                  <Link to="/register" className="btn-primary flex-1 text-center py-2.5 text-sm">
                    Register
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
