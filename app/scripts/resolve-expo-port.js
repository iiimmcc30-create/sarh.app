/**
 * Find a free Metro port starting at EXPO_PORT (default 8081).
 * Works on Windows, macOS, and Linux (unlike PowerShell-only checks).
 */
const net = require('net');

function isPortFree(port, host = '0.0.0.0') {
  return new Promise((resolve) => {
    const tester = net.createServer();
    tester.unref();
    tester.once('error', () => resolve(false));
    tester.once('listening', () => {
      tester.close(() => resolve(true));
    });
    tester.listen({ port, host, exclusive: true });
  });
}

async function resolveExpoPort(preferred = Number(process.env.EXPO_PORT) || 8081, maxAttempts = 10) {
  for (let port = preferred; port < preferred + maxAttempts; port += 1) {
    // eslint-disable-next-line no-await-in-loop
    if (await isPortFree(port)) {
      return String(port);
    }
  }
  return String(preferred);
}

module.exports = {
  isPortFree,
  resolveExpoPort,
};
