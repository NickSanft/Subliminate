import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './theme';
import { AppRoutes } from './routes';

// Strip the trailing slash so React Router's basename matches its own
// expectations. `import.meta.env.BASE_URL` is `/` in dev and
// `/Subliminate/` in the Pages build.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

export function App() {
  const routerProps = basename ? { basename } : {};
  return (
    <ThemeProvider>
      <BrowserRouter {...routerProps}>
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider>
  );
}
