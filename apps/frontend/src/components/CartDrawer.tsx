import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import clsx from 'clsx';

export default function CartDrawer() {
  const { cart, isOpen, closeCart, updateItem, removeItem, loading } = useCartStore();

  // Prevent body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={clsx(
          'fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={closeCart}
      />

      {/* Drawer */}
      <div
        className={clsx(
          'fixed top-0 right-0 h-full w-full max-w-md z-50 bg-stone-50 shadow-2xl',
          'flex flex-col transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-200">
          <div className="flex items-center gap-3">
            <ShoppingBag size={18} className="text-stone-700" />
            <h2 className="font-display text-lg font-medium text-stone-900">Your Cart</h2>
            {(cart?.itemCount ?? 0) > 0 && (
              <span className="text-sm text-stone-400">({cart?.itemCount} items)</span>
            )}
          </div>
          <button onClick={closeCart} className="btn-ghost p-2">
            <X size={18} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          {!cart?.items.length ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
              <ShoppingBag size={48} className="text-stone-200" />
              <div>
                <p className="font-medium text-stone-700">Your cart is empty</p>
                <p className="text-sm text-stone-400 mt-1">Add something beautiful</p>
              </div>
              <button onClick={closeCart} className="btn-secondary mt-2">
                Continue Shopping
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-stone-100">
              {cart.items.map((item) => (
                <li key={item.productId} className="flex gap-4 px-6 py-5">
                  <div className="w-20 h-20 bg-stone-100 flex-shrink-0 overflow-hidden">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-900 leading-snug truncate pr-2">
                      {item.product.name}
                    </p>
                    <p className="text-sm text-stone-500 mt-0.5">
                      ${item.product.price.toFixed(2)}
                    </p>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center border border-stone-200">
                        <button
                          onClick={() => updateItem(item.productId, item.quantity - 1)}
                          disabled={loading}
                          className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors disabled:opacity-40"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="px-3 text-sm font-medium text-stone-800 min-w-[2rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateItem(item.productId, item.quantity + 1)}
                          disabled={loading || item.quantity >= item.product.stock}
                          className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors disabled:opacity-40"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.productId)}
                        disabled={loading}
                        className="text-stone-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-stone-900 whitespace-nowrap">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {(cart?.items.length ?? 0) > 0 && (
          <div className="border-t border-stone-200 px-6 py-5 space-y-4">
            {cart!.discount > 0 && (
              <div className="flex justify-between text-sm text-stone-500">
                <span>Savings</span>
                <span className="text-green-600">−${cart!.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-stone-500">
              <span>Subtotal</span>
              <span>${cart!.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-medium text-stone-900">
              <span>Total</span>
              <span>${cart!.total.toFixed(2)}</span>
            </div>
            <Link
              to="/checkout"
              onClick={closeCart}
              className="btn-primary w-full"
            >
              Checkout
              <ArrowRight size={16} />
            </Link>
            <button
              onClick={closeCart}
              className="w-full text-sm text-stone-500 hover:text-stone-900 text-center transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}
