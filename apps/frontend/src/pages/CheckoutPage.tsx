import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Check, Package } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { createCheckoutSession, fetchCheckoutSessionStatus } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import type { Customer, Order } from '../types';

type Step = 'info' | 'review';
const GUEST_CHECKOUT_EMAIL_KEY = 'lumiereCheckoutEmail';

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = true,
  placeholder = '',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs tracking-widest uppercase text-stone-500 mb-1.5">
        {label} {required && <span className="text-accent">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        placeholder={placeholder}
        className="input"
      />
    </div>
  );
}

function isCustomerComplete(customer: Customer): boolean {
  return Boolean(
    customer.name.trim() &&
    customer.email.trim() &&
    customer.address.line1.trim() &&
    customer.address.city.trim() &&
    customer.address.state.trim() &&
    customer.address.zip.trim() &&
    customer.address.country.trim()
  );
}

export default function CheckoutPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const cancelled = searchParams.get('cancelled') === '1';
  const { cart, cartId, clearLocalCart } = useCartStore();
  const { user } = useAuthStore();
  const [step, setStep] = useState<Step>('info');
  const [submitting, setSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [customer, setCustomer] = useState<Customer>({
    name: user?.name ?? '',
    email: user?.email ?? '',
    address: { line1: '', line2: '', city: '', state: '', zip: '', country: 'US' },
  });

  useEffect(() => {
    setCustomer((current) => ({
      ...current,
      name: current.name || user?.name || '',
      email: current.email || user?.email || '',
    }));
  }, [user?.email, user?.name]);

  useEffect(() => {
    if (!sessionId) return;
    const currentSessionId = sessionId;
    const checkoutEmail = user?.email ?? window.sessionStorage.getItem(GUEST_CHECKOUT_EMAIL_KEY) ?? undefined;

    let cancelledRequest = false;

    async function syncStripeSession() {
      setSubmitting(true);
      try {
        const response = await fetchCheckoutSessionStatus(currentSessionId, checkoutEmail);
        if (cancelledRequest || !response.data) return;

        if (response.data.order.paymentStatus !== 'PAID') {
          toast.error('Stripe did not report a completed payment for this session.');
          return;
        }

        setCompletedOrder(response.data.order);
        clearLocalCart();
        window.sessionStorage.removeItem(GUEST_CHECKOUT_EMAIL_KEY);
        setSearchParams({}, { replace: true });
      } catch {
        if (!cancelledRequest) {
          toast.error('Unable to confirm your Stripe payment session.');
        }
      } finally {
        if (!cancelledRequest) {
          setSubmitting(false);
        }
      }
    }

    void syncStripeSession();

    return () => {
      cancelledRequest = true;
    };
  }, [clearLocalCart, sessionId, setSearchParams, user?.email]);

  useEffect(() => {
    if (!cancelled) return;
    toast.error('Stripe checkout was cancelled before payment completed.');
    setSearchParams({}, { replace: true });
  }, [cancelled, setSearchParams]);

  const handleContinue = () => {
    if (!isCustomerComplete(customer)) {
      toast.error('Please fill in all required shipping details.');
      return;
    }

    setStep('review');
  };

  const handleStripeCheckout = async () => {
    if (!cartId || !cart || cart.items.length === 0) return;
    if (!isCustomerComplete(customer)) {
      toast.error('Please complete your shipping details first.');
      setStep('info');
      return;
    }

    setSubmitting(true);
    try {
      window.sessionStorage.setItem(GUEST_CHECKOUT_EMAIL_KEY, customer.email.trim().toLowerCase());
      const response = await createCheckoutSession({
        cartId,
        customer,
        returnUrl: window.location.origin,
      });

      const session = response.data;
      if (!session?.url) {
        throw new Error('Stripe session was not created');
      }

      window.location.assign(session.url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to start Stripe checkout.');
      setSubmitting(false);
    }
  };

  if (completedOrder) {
    return (
      <div className="max-w-lg mx-auto px-4 py-28 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check size={28} className="text-green-600" />
        </div>
        <p className="text-xs tracking-widest uppercase text-accent mb-3">Payment Confirmed</p>
        <h1 className="font-display text-3xl font-medium text-stone-900 mb-4">
          Thank you, {completedOrder.customer.name.split(' ')[0]}!
        </h1>
        <p className="text-stone-500 mb-2">Stripe payment succeeded and your order is now processing.</p>
        <p className="text-xs font-mono text-stone-400 mb-8">
          Order #{completedOrder.id.split('-')[0].toUpperCase()}
        </p>
        <div className="bg-stone-50 border border-stone-200 p-6 text-left mb-8 space-y-3">
          {completedOrder.items.map((item) => (
            <div key={item.productId} className="flex justify-between text-sm">
              <span className="text-stone-700">
                {item.product.name} x {item.quantity}
              </span>
              <span className="text-stone-900 font-medium">
                ${(item.product.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
          <div className="border-t border-stone-200 pt-3 flex justify-between font-medium">
            <span>Total</span>
            <span>${completedOrder.total.toFixed(2)}</span>
          </div>
        </div>
        <Link to="/track-order" className="btn-primary">
          Track Order
        </Link>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-28 text-center">
        <Package size={48} className="text-stone-200 mx-auto mb-4" />
        <h2 className="font-display text-2xl text-stone-800 mb-2">Your cart is empty</h2>
        <p className="text-stone-400 mb-6">Nothing to check out yet.</p>
        <Link to="/products" className="btn-primary">Shop Now</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 pt-28">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 transition-colors mb-8"
      >
        <ChevronLeft size={16} />
        Back to Shopping
      </Link>

      <h1 className="font-display text-3xl font-medium text-stone-900 mb-8">Checkout</h1>

      <div className="flex items-center gap-3 mb-10">
        {(['info', 'review'] as Step[]).map((currentStep, index) => (
          <div key={currentStep} className="flex items-center gap-3">
            <div
              className={clsx(
                'flex items-center gap-2 text-sm transition-colors',
                step === currentStep ? 'text-stone-900 font-medium' : 'text-stone-400'
              )}
            >
              <div
                className={clsx(
                  'w-6 h-6 rounded-full text-xs flex items-center justify-center',
                  step === currentStep ? 'bg-stone-900 text-white' : 'bg-stone-200 text-stone-500'
                )}
              >
                {index + 1}
              </div>
              {currentStep === 'info' ? 'Your Info' : 'Stripe Review'}
            </div>
            {index < 1 && <div className="w-8 h-px bg-stone-200" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          {step === 'info' ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-sm font-medium text-stone-700 tracking-wide uppercase mb-4">
                  Contact
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="Full Name"
                    value={customer.name}
                    onChange={(value) => setCustomer((current) => ({ ...current, name: value }))}
                    placeholder="Jane Smith"
                  />
                  <Field
                    label="Email"
                    type="email"
                    value={customer.email}
                    onChange={(value) => setCustomer((current) => ({ ...current, email: value }))}
                    placeholder="jane@example.com"
                  />
                </div>
              </div>

              <div>
                <h2 className="text-sm font-medium text-stone-700 tracking-wide uppercase mb-4">
                  Shipping Address
                </h2>
                <div className="space-y-4">
                  <Field
                    label="Address Line 1"
                    value={customer.address.line1}
                    onChange={(value) => setCustomer((current) => ({
                      ...current,
                      address: { ...current.address, line1: value },
                    }))}
                    placeholder="123 Main Street"
                  />
                  <Field
                    label="Address Line 2"
                    value={customer.address.line2 || ''}
                    onChange={(value) => setCustomer((current) => ({
                      ...current,
                      address: { ...current.address, line2: value },
                    }))}
                    required={false}
                    placeholder="Apt, suite, etc. (optional)"
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <Field
                      label="City"
                      value={customer.address.city}
                      onChange={(value) => setCustomer((current) => ({
                        ...current,
                        address: { ...current.address, city: value },
                      }))}
                      placeholder="New York"
                    />
                    <Field
                      label="State"
                      value={customer.address.state}
                      onChange={(value) => setCustomer((current) => ({
                        ...current,
                        address: { ...current.address, state: value },
                      }))}
                      placeholder="NY"
                    />
                    <Field
                      label="ZIP Code"
                      value={customer.address.zip}
                      onChange={(value) => setCustomer((current) => ({
                        ...current,
                        address: { ...current.address, zip: value },
                      }))}
                      placeholder="10001"
                    />
                    <Field
                      label="Country"
                      value={customer.address.country}
                      onChange={(value) => setCustomer((current) => ({
                        ...current,
                        address: { ...current.address, country: value.toUpperCase() },
                      }))}
                      placeholder="US"
                    />
                  </div>
                </div>
              </div>

              <button onClick={handleContinue} className="btn-primary w-full py-4">
                Continue to Stripe
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="card p-6">
                <h2 className="text-sm font-medium text-stone-700 uppercase tracking-wide mb-4">
                  Delivery To
                </h2>
                <p className="text-stone-800">{customer.name}</p>
                <p className="text-stone-500 text-sm">{customer.email}</p>
                <p className="text-stone-500 text-sm mt-1">
                  {customer.address.line1}
                  {customer.address.line2 ? `, ${customer.address.line2}` : ''},{' '}
                  {customer.address.city}, {customer.address.state} {customer.address.zip},{' '}
                  {customer.address.country}
                </p>
                <button
                  onClick={() => setStep('info')}
                  className="text-xs text-accent hover:text-accent-dark transition-colors mt-3"
                >
                  Edit
                </button>
              </div>

              <div className="card p-6">
                <h2 className="text-sm font-medium text-stone-700 uppercase tracking-wide mb-4">
                  Payment
                </h2>
                <p className="text-sm text-stone-600 leading-6">
                  Payment is collected on Stripe’s hosted checkout page. Card entry, 3D Secure,
                  and payment authentication happen there rather than inside this app.
                </p>
                <div className="flex items-center gap-2 mt-3 text-xs text-stone-400">
                  <span>Secure</span>
                  <span>Redirects to Stripe for PCI-compliant card handling.</span>
                </div>
              </div>

              <button
                onClick={handleStripeCheckout}
                disabled={submitting}
                className="btn-primary w-full py-4 text-base disabled:opacity-60"
              >
                {submitting ? 'Redirecting to Stripe...' : `Pay with Stripe - $${cart.total.toFixed(2)}`}
              </button>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h2 className="text-sm font-medium text-stone-700 uppercase tracking-wide mb-4">
              Order Summary
            </h2>
            <ul className="space-y-4 mb-6">
              {cart.items.map((item) => (
                <li key={item.productId} className="flex gap-3">
                  <div className="w-14 h-14 bg-stone-100 flex-shrink-0 overflow-hidden">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-stone-800 truncate">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-stone-400">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-xs font-medium text-stone-800">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="border-t border-stone-100 pt-4 space-y-2">
              {cart.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Savings</span>
                  <span>-${cart.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-stone-500">
                <span>Subtotal</span>
                <span>${cart.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-stone-500">
                <span>Shipping</span>
                <span className="text-green-600">Free</span>
              </div>
              <div className="flex justify-between font-medium text-stone-900 pt-2 border-t border-stone-100">
                <span>Total</span>
                <span>${cart.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
