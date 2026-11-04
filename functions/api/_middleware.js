/**
 * Cloudflare Pages Function Middleware: /api/*
 * Secures all API endpoints by requiring a valid Bearer token.
 */

const DEFAULT_PASSWORD = 'skola2026';
const SALT = 'edu_suplovani_salt_2026';

async function computeToken(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + ':' + SALT);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Allow preflight OPTIONS
  if (request.method === 'OPTIONS') {
    return next();
  }

  // Allow auth endpoint requests
  if (url.pathname.endsWith('/api/auth')) {
    return next();
  }

  // Extract Bearer token from Authorization header
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  const expectedPassword = (env && env.APP_PASSWORD) ? env.APP_PASSWORD : DEFAULT_PASSWORD;
  const expectedToken = await computeToken(expectedPassword);

  if (!token || token !== expectedToken) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Neautorizovaný přístup. Přihlaste se prosím platným heslem.',
      }),
      { status: 401, headers: corsHeaders }
    );
  }

  return next();
}

