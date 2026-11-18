import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {verifyAccessRequest, denied} from '../src/access-jwt.js';
globalThis.crypto ||= webcrypto;
const env={
  TEAM_DOMAIN:'https://wtw-example.cloudflareaccess.com',
  POLICY_AUD:'a'.repeat(64),
  ADMIN_EMAIL:'owner@example.invalid'
};
const base64url=data=>Buffer.from(data).toString('base64url');
const part=data=>base64url(JSON.stringify(data));
test('private Pages API refuses requests without configured access',async()=>{
 const r=new Request('https://wire-to-wire.pages.dev/api/bootstrap');
 assert.equal(await verifyAccessRequest(r,{}),null);
 assert.equal(await verifyAccessRequest(r,env),null);
 assert.equal(denied().status,403);
});
test('private Pages API refuses unverified/forged JWT',async()=>{
 const fake=[part({alg:'RS256',kid:'fake'}),part({email:'owner@example.invalid',aud:[env.POLICY_AUD],iss:env.TEAM_DOMAIN,exp:Math.floor(Date.now()/1000)+400,iat:Math.floor(Date.now()/1000)}),base64url('not signed')].join('.');
 const r=new Request('https://wire-to-wire.pages.dev/api/bootstrap',{headers:{'Cf-Access-Jwt-Assertion':fake}});
 const mock=async()=>({ok:true,json:async()=>({keys:[]})});
 assert.equal(await verifyAccessRequest(r,env,mock),null);
});
test('private Pages API accepts a correctly signed Access JWT for its allowed administrator',async()=>{
 const keys=await webcrypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
 const pub=await webcrypto.subtle.exportKey('jwk',keys.publicKey);pub.kid='wtw-test-key';pub.alg='RS256';
 const now=Math.floor(Date.now()/1000);
 const tokenPrefix=[part({alg:'RS256',typ:'JWT',kid:pub.kid}),part({aud:[env.POLICY_AUD],iss:env.TEAM_DOMAIN,email:'owner@example.invalid',iat:now,exp:now+600})].join('.');
 const sig=await webcrypto.subtle.sign('RSASSA-PKCS1-v1_5',keys.privateKey,new TextEncoder().encode(tokenPrefix));
 const token=tokenPrefix+'.'+base64url(new Uint8Array(sig));
 const req=new Request('https://wire-to-wire.pages.dev/api/bootstrap',{headers:{'Cf-Access-Jwt-Assertion':token}});
 const mock=async()=>({ok:true,json:async()=>({keys:[pub]})});
 assert.equal(await verifyAccessRequest(req,env,mock),'owner@example.invalid');
 assert.equal(await verifyAccessRequest(req,{...env,ADMIN_EMAIL:'different@example.invalid'},mock),null);
});
