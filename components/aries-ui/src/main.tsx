import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { registerAnoncreds } from "@hyperledger/anoncreds-shared";
import { BrowserAnoncreds } from './BrowserAnoncreds.ts';
const browserAnoncreds = new BrowserAnoncreds();
registerAnoncreds({ lib: browserAnoncreds });


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
