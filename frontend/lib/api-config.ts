// Strips trailing slashes to prevent double-slash issues in URLs
export const API_URL = (
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
).replace(/\/+$/, '');

// WebSocket URL: http → ws, https → wss (required for secure Railway deployments)
export const WS_URL = API_URL
    .replace(/^https:\/\//, 'wss://')
    .replace(/^http:\/\//, 'ws://');
