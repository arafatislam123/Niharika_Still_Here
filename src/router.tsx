import { createBrowserRouter } from 'react-router-dom';
import Layout from './components/Layout';
import NotFound from './pages/NotFound';

/** Each page is its own chunk, so the 3D code only loads when a 3D page is opened. */
export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Layout />,
      errorElement: <NotFound />,
      children: [
        { index: true, lazy: () => import('./pages/Home').then((m) => ({ Component: m.default })) },
        {
          path: 'explore',
          lazy: () => import('./pages/Explore').then((m) => ({ Component: m.default })),
        },
        {
          path: 'explore/:world',
          lazy: () => import('./pages/WorldPage').then((m) => ({ Component: m.default })),
        },
        {
          path: 'artifacts',
          lazy: () => import('./pages/Artifacts').then((m) => ({ Component: m.default })),
        },
        {
          path: 'artifacts/:id',
          lazy: () => import('./pages/ArtifactPage').then((m) => ({ Component: m.default })),
        },
        {
          path: 'ask',
          lazy: () => import('./pages/AskExplorer').then((m) => ({ Component: m.default })),
        },
        {
          path: 'game',
          lazy: () => import('./pages/GamePage').then((m) => ({ Component: m.default })),
        },
        {
          path: 'timeline',
          lazy: () => import('./pages/Timeline').then((m) => ({ Component: m.default })),
        },
        {
          path: 'learn',
          lazy: () => import('./pages/Learn').then((m) => ({ Component: m.default })),
        },
        {
          path: 'sources',
          lazy: () => import('./pages/Sources').then((m) => ({ Component: m.default })),
        },
        { path: '*', element: <NotFound /> },
      ],
    },
  ],
  // '/' locally and on Netlify; '/Niharika_Still_Here' on GitHub Pages.
  { basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' },
);
