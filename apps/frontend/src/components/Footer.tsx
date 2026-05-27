import { Link } from 'react-router-dom';
import { useState, FormEvent } from 'react';
import toast from 'react-hot-toast';

export default function Footer() {
  const [email, setEmail] = useState('');
  const handleNewsletter = (e: FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) { toast.error('Enter a valid email'); return; }
    toast.success('You\'re subscribed!');
    setEmail('');
  };

  return (
    <footer className="bg-stone-900 text-stone-400 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-1">
            <Link to="/" className="font-display text-xl font-medium tracking-[0.15em] text-stone-100">
              LUMIÈRE
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-stone-500">
              Curated goods for considered living. Every piece chosen with intention.
            </p>
          </div>

          <div>
            <h4 className="text-xs tracking-widest uppercase text-stone-300 mb-4">Shop</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/products"                          className="hover:text-stone-100 transition-colors">All Products</Link></li>
              <li><Link to="/products?category=electronics"     className="hover:text-stone-100 transition-colors">Electronics</Link></li>
              <li><Link to="/products?category=clothing"        className="hover:text-stone-100 transition-colors">Clothing</Link></li>
              <li><Link to="/products?category=accessories"     className="hover:text-stone-100 transition-colors">Accessories</Link></li>
              <li><Link to="/products?category=home"            className="hover:text-stone-100 transition-colors">Home</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs tracking-widest uppercase text-stone-300 mb-4">Account</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/account"           className="hover:text-stone-100 transition-colors">My Profile</Link></li>
              <li><Link to="/wishlist"           className="hover:text-stone-100 transition-colors">Wishlist</Link></li>
              <li><Link to="/account"            className="hover:text-stone-100 transition-colors">Order History</Link></li>
              <li><Link to="/track-order"        className="hover:text-stone-100 transition-colors">Track Order</Link></li>
              <li><Link to="/login"              className="hover:text-stone-100 transition-colors">Sign In</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs tracking-widest uppercase text-stone-300 mb-4">Newsletter</h4>
            <p className="text-sm text-stone-500 mb-4">Thoughtful dispatches on new arrivals and ideas.</p>
            <form onSubmit={handleNewsletter} className="flex">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 bg-stone-800 border border-stone-700 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-stone-500"
              />
              <button type="submit" className="bg-accent hover:bg-accent-dark text-white px-4 py-2 text-sm transition-colors">
                →
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-stone-800 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-stone-600">© {new Date().getFullYear()} LUMIÈRE. All rights reserved.</p>
          <div className="flex gap-6 text-xs">
            <span className="text-stone-600 cursor-default">Privacy</span>
            <span className="text-stone-600 cursor-default">Terms</span>
            <span className="text-stone-600 cursor-default">Cookies</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
