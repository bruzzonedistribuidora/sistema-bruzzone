import React from 'react';
import ReactDOM from 'react-dom/client';
import './firebase'; // <--- AGREGÁ ESTA LÍNEA (Es el cable que enciende el motor)
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);