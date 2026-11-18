import {test} from 'node:test';
import assert from 'node:assert/strict';
import handler from '../src/worker.js';
const env={ASSETS:{fetch:async()=>new Response('static UI',{headers:{'Content-Type':'text/html'}})}};
test('production URL fails closed without Access even with dev bypass true',async()=>{
  const request=new Request('https://wtw-canon-desk.example.workers.dev/');
  const response=await handler.fetch(request,{...env,DEV_BYPASS_ACCESS:'true'},{access:undefined});
  assert.equal(response.status,403);
});
test('unauthorized authenticated email fails closed',async()=>{
  const request=new Request('https://wtw-canon-desk.example.workers.dev/');
  const response=await handler.fetch(request,{...env,ADMIN_EMAIL:'authorized@example.com'},{access:{getIdentity:async()=>({email:'someone@example.com'})}});
  assert.equal(response.status,403);
});
test('authorized user can read protected static assets',async()=>{
  const request=new Request('https://wtw-canon-desk.example.workers.dev/');
  const response=await handler.fetch(request,{...env,ADMIN_EMAIL:'authorized@example.com'},{access:{getIdentity:async()=>({email:'authorized@example.com'})}});
  assert.equal(response.status,200);
  assert.match(await response.text(),/static UI/);
  assert.match(response.headers.get('Content-Security-Policy'),/default-src/);
});
test('local development requires explicit opt-in bypass',async()=>{
  const request=new Request('http://localhost:8787/');
  assert.equal((await handler.fetch(request,env,{})).status,403);
  assert.equal((await handler.fetch(request,{...env,DEV_BYPASS_ACCESS:'true'},{})).status,200);
});
test('API cannot mutate source without D1 bound',async()=>{
  const request=new Request('http://localhost:8787/api/bootstrap');
  const response=await handler.fetch(request,{...env,DEV_BYPASS_ACCESS:'true'},{});
  assert.equal(response.status,503);
});