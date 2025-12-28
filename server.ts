import express from 'express';
import next from 'next';
import dotenv from 'dotenv';
import path from 'path';
import { createApiApp } from './backend/src/api';

// Load environment variables
dotenv.config();

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT || '3000', 10);
const hostname = process.env.HOSTNAME || 'localhost';

// Get the frontend directory path
const frontendDir = path.join(process.cwd(), 'frontend');

// Create Next.js app - point to frontend directory
const nextApp = next({ 
  dev, 
  hostname, 
  port,
  dir: frontendDir
});
const handle = nextApp.getRequestHandler();

// Start the server
nextApp.prepare().then(() => {
  // Create Express app
  const server = express();

  // Create and mount API routes
  const apiApp = createApiApp();
  server.use(apiApp);

  // Handle all other routes with Next.js
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  // Start listening
  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}).catch((err) => {
  console.error('Error starting server:', err);
  process.exit(1);
});

