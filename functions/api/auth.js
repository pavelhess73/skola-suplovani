/**
 * Cloudflare Pages Function: /api/auth
 * Handles login and token verification.
 */

const DEFAULT_PASSWORD = 'skola2026';
const SALT = 'edu_suplovani_salt_2026';

export async function computeToken(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + ':' + SALT);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function getExpectedPassword(env) {
  return (env && env.APP_PASSWORD) ? env.APP_PASSWORD : DEFAULT_PASSWORD;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const body = await request.json().catch(() => ({}));
    const { password } = body;

    const expectedPassword = getExpectedPassword(env);

    if (!password || password !== expectedPassword) {
      return new Response(
        JSON.stringify({ success: false, error: 'Nesprávné přihlašovací heslo.' }),
        { status: 401, headers: corsHeaders }
      );
    }

    const token = await computeToken(expectedPassword);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Přihlášení bylo úspěšné.',
        token,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: 'Chyba serveru při ověřování hesla.' }),
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  const expectedPassword = getExpectedPassword(env);
  const expectedToken = await computeToken(expectedPassword);

  if (!token || token !== expectedToken) {
    return new Response(
      JSON.stringify({ success: false, error: 'Neplatný autorizační token.' }),
      { status: 401, headers: corsHeaders }
    );
  }

  return new Response(
    JSON.stringify({ success: true, valid: true }),
    { status: 200, headers: corsHeaders }
  );
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

