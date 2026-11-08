// The live WTW website is Cloudflare Pages, not the separate Workers runtime.
// Route /api/* into the D1-backed API only after verifying a signed
// Cloudflare Access JWT and the owner's allowed email.
import {verifyAccessRequest, denied} from '../../src/access-jwt.js';
import {api} from '../../src/worker.js';
export async function onRequest(context) {
  const email = await verifyAccessRequest(context.request, context.env);
  if (!email) return denied();
  try {
    return await api(context.request,context.env,email);
  } catch {
    // Schema is not migrated until the WTW-only D1 is explicitly initialized.
    return new Response(JSON.stringify({error:'WTW database not initialized or unavailable. The existing sample preview is unchanged.'}),{
      status:503,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}
    });
  }
}
