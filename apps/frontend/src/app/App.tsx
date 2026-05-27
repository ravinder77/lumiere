import { useAppBootstrap } from './hooks/useAppBootstrap';
import { AppProviders } from './providers/AppProviders';
import { AppRouter } from './router/AppRouter';

function AppShell() {
  useAppBootstrap();
  return <AppRouter />;
}

export default function App() {
  return (
    <AppProviders>
      <AppShell />
    </AppProviders>
  );
}
