// vite.config.js

/**
 * This configuration file is for the Vite development server.
 * It addresses deployment issues on platforms like Render.com.
 * @type {import('vite').UserConfig}
 */
const config = {
  server: {
    // This is crucial for deployment. It tells Vite to listen on all
    // available network interfaces, not just localhost. Render.com needs this
    // to connect to your running application inside its container.
    host: '0.0.0.0',
    
    // Render.com provides a PORT environment variable that your app must bind to.
    // This line reads that variable, or defaults to 5173 for local development.
    port: parseInt(process.env.PORT || '5173', 10),

    // This is a security feature to prevent DNS rebinding attacks.
    // It allows requests from your deployed application's domain.
    allowedHosts: [
        'physics-diagram-converter.onrender.com',
    ],
  },
};

export default config;
