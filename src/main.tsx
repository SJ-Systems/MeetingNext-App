if (typeof window !== 'undefined') {
  (window as any).global = (window as any).global || window;
}

import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
