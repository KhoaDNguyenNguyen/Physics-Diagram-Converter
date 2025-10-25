// vite.config.js

/**
 * This configuration file is for the Vite development server.
 * It addresses the "Blocked request" error by specifying allowed hosts.
 * @type {import('vite').UserConfig}
 */
const config = {
  server: {
    // This is the key change to fix the error.
    // It explicitly tells Vite to allow HTTP requests where the "Host" header
    // matches this value. This is a security feature in Vite to prevent
    // DNS rebinding attacks.
    allowedHosts: [
        'physics-diagram-converter.onrender.com',
    ],
  },
};

export default config;
