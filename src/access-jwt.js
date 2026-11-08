/** Validate a Cloudflare Access application JWT before exposing private WTW history.
 * Environment (configured in Cloudflare Pages, never in Git):
 * TEAM_DOMAIN=https://<team>.cloudflareaccess.com
 * POLICY_AUD=<Application Audience tag>
 * ADMIN_EMAIL=<authorized sign-in email>
 */
const FAIL = 'Private history API requires configured Cloudflare Access.';
const decoder = new TextDecoder();
function decodeSegment(x) {
  if (!x || !/^[A-Za-z0-9_-]+$/.test(x)) throw new Error('Invalid JWT encoding');
  const b64 = x.replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64.padEnd(Math.ceil(b64.length / 4) * 4, '='));
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}
export async function verifyAccessRequest(request, env, fetcher = fetch) {
  const team = String(env.TEAM_DOMAIN || '').replace(/\/$/, '');
  const audience = String(env.POLICY_AUD || '');
  const emails = String(env.ADMIN_EMAIL || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  // No auth config? Fail closed. A signed JWT is always required for private data.
  if (!/^https:\/\/[a-zA-Z0-9-]+\.cloudflareaccess\.com$/.test(team) ||
      !/^[a-zA-Z0-9_-]{16,}$/.test(audience) || !emails.length) return null;
  const cookie = (request.headers.get('Cookie') || '').split(';').map(s => s.trim()).find(s => s.startsWith('CF_Authorization='));
  const token = request.headers.get('Cf-Access-Jwt-Assertion') || (cookie && cookie.slice('CF_Authorization='.length));
  if (!token || token.length > 16000) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const header = JSON.parse(decoder.decode(decodeSegment(parts[0])));
    const payload = JSON.parse(decoder.decode(decodeSegment(parts[1])));
    if (header.alg !== 'RS256' || !header.kid || header.typ && header.typ !== 'JWT') return null;
    const now = Math.floor(Date.now()/1000);
    if (payload.iss !== team || ![payload.aud].flat().includes(audience) ||
        !Number.isFinite(payload.exp) || payload.exp <= now ||
        !Number.isFinite(payload.iat) || payload.iat > now + 60 ||
        payload.nbf && payload.nbf > now + 60 ||
        typeof payload.email !== 'string' || !emails.includes(payload.email.toLowerCase())) return null;
    const certs = await fetcher(team + '/cdn-cgi/access/certs');
    if (!certs.ok) return null;
    const body = await certs.json();
    const jwk = (body.keys || []).find(k => k.kid === header.kid && k.kty === 'RSA' && (!k.alg || k.alg === 'RS256'));
    if (!jwk) return null;
    const key = await crypto.subtle.importKey('jwk', jwk, {name: 'RSASSA-PKCS1-v1_5',hash:'SHA-256'}, false, ['verify']);
    const binary = decodeSegment(parts[2]);
    const input = new TextEncoder().encode(parts[0] + '.' + parts[1]);
    return await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, binary, input) ? payload.email : null;
  } catch { return null; }
}
export function denied() {
  return new Response(JSON.stringify({error:FAIL}), {
    status:403,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}
  });
}
