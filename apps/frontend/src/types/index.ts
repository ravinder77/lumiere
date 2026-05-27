export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  image: string;
  images: string[];
  rating: number;
  reviewCount: number;
  stock: number;
  tags: string[];
  featured?: boolean;
  badge?: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  product: Product;
}

export interface Cart {
  id: string;
  items: CartItem[];
  total: number;
  subtotal: number;
  discount: number;
  itemCount: number;
}

export interface Order {
  id: string;
  cartId: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  customer: Customer;
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutSessionResponse {
  orderId: string;
  sessionId: string;
  url: string | null;
}

export interface CheckoutSessionStatus {
  order: Order;
  session: {
    id: string;
    status: string | null;
    paymentStatus: string | null;
  };
}

export interface Customer {
  name: string;
  email: string;
  address: Address;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Category {
  id: string;
  name: string;
  count: number;
}
