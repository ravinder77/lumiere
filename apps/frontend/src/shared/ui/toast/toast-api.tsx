import type { CSSProperties, ReactPortal } from 'react';
import { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

type ToastType = 'success' | 'error' | 'info';

interface ToastRecord {
  id: number;
  type: ToastType;
  message: string;
}

interface ToasterProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  toastOptions?: {
    style?: CSSProperties;
  };
}

const listeners = new Set<() => void>();
let toasts: ToastRecord[] = [];
let nextId = 1;

function notify(): void {
  listeners.forEach((listener) => listener());
}

function pushToast(type: ToastType, message: string): void {
  const id = nextId++;
  toasts = [...toasts, { id, type, message }];
  notify();

  window.setTimeout(() => {
    toasts = toasts.filter((toast) => toast.id !== id);
    notify();
  }, 2800);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): ToastRecord[] {
  return toasts;
}

function getPositionClasses(position: ToasterProps['position']): string {
  switch (position) {
    case 'bottom-left':
      return 'bottom-4 left-4 items-start';
    case 'top-right':
      return 'top-4 right-4 items-end';
    case 'top-left':
      return 'top-4 left-4 items-start';
    case 'bottom-right':
    default:
      return 'bottom-4 right-4 items-end';
  }
}

function getAccentClasses(type: ToastType): string {
  switch (type) {
    case 'success':
      return 'border-l-[#c9a96e]';
    case 'error':
      return 'border-l-red-500';
    case 'info':
    default:
      return 'border-l-stone-400';
  }
}

export function Toaster({
  position = 'bottom-right',
  toastOptions,
}: ToasterProps): ReactPortal | null {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className={`pointer-events-none fixed z-[100] flex flex-col gap-2 ${getPositionClasses(position)}`}>
      {snapshot.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto min-w-[260px] border border-stone-800 border-l-4 bg-stone-900 px-4 py-3 text-sm text-stone-50 shadow-xl ${getAccentClasses(toast.type)}`}
          style={toastOptions?.style}
        >
          {toast.message}
        </div>
      ))}
    </div>,
    document.body
  );
}

const toast = {
  success(message: string) {
    pushToast('success', message);
  },
  error(message: string) {
    pushToast('error', message);
  },
  message(message: string) {
    pushToast('info', message);
  },
};

export default toast;
