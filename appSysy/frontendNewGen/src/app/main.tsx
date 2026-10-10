import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '../ui/theme/tokens.css';
import { aplicarBranding } from '../ui/theme/branding';
import { iniciarTema } from '../ui/theme/useTema';
import App from './App';

aplicarBranding();
iniciarTema();

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
