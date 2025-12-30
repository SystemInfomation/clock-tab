// Custom server for Google Cloud Run - binds to 0.0.0.0:PORT
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const hostname = '0.0.0.0'; // Required for Google Cloud Run
const port = parseInt(process.env.PORT || '8080', 10);

// Always run in production mode for Cloud Run
const app = next({ dev: false });
const handle = app.getRequestHandler();

let server;
let isReady = false;

// Create server immediately to start listening on port
server = createServer(async (req, res) => {
  // Health check endpoint - always return 200 for Cloud Run startup probe
  // Cloud Run only checks HTTP status code, not response body
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: isReady ? 'healthy' : 'initializing', 
      ready: isReady 
    }));
    return;
  }

  // Root path - let Next.js handle it when ready, otherwise show status
  if (req.url === '/') {
    if (!isReady) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'initializing', message: 'Server is starting up' }));
      return;
    }
    // Fall through to Next.js handler below
  }

  // Wait for Next.js to be ready before handling other requests
  if (!isReady) {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'initializing', message: 'Server is starting up' }));
    return;
  }

  try {
    const parsedUrl = parse(req.url, true);
    await handle(req, res, parsedUrl);
  } catch (err) {
    console.error('Error occurred handling', req.url, err);
    res.statusCode = 500;
    res.end('internal server error');
  }
});

// Start listening immediately (before Next.js is ready)
server.listen(port, hostname, (err) => {
  if (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
  console.log(`> Server listening on http://${hostname}:${port}`);
  console.log('> Initializing Next.js...');
});

// Prepare Next.js in the background
app.prepare()
  .then(() => {
    isReady = true;
    console.log('> Next.js ready');
  })
  .catch((err) => {
    console.error('Failed to prepare Next.js:', err);
    // Don't exit - keep server running for health checks
    // Cloud Run will restart if health checks fail
  });

// Handle graceful shutdown for Google Cloud Run
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  if (server) {
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  }
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  if (server) {
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  }
});

