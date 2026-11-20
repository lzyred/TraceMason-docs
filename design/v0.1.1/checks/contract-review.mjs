import vm from 'node:vm';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const context=vm.createContext({URL,Uint8Array,setTimeout:fn=>fn(),localStorage:{getItem:()=>null,setItem:()=>{}}});
for(const f of ['contract.js','mock-api.js','api-client.js','proxy-plan.js'])vm.runInContext(await fs.readFile(new URL('../prototype/'+f,import.meta.url),'utf8'),context);
const t=new context.MockProviderTransport(),api=new context.ProviderClient(t),C=context.ProviderContract;
let snap=await api.list();assert.equal(Object.keys(snap.providers).length,3);assert.equal('active' in snap,false);
for(const [id,kind] of [['codex-main','openai'],['deepseek','deepseek'],['claude','claude']]){
 assert.equal(snap.providers[id].provider_kind,kind);assert.equal(snap.providers[id].enabled,true);
 await api.setEnabled(id,false);assert.equal((await api.list()).providers[id].enabled,false);await api.setEnabled(id,true);
 t.applyScenario('auth');await api.test(id,{method:'POST',path:'/unknown',headers:{},body:'opaque'});assert.equal((await api.list()).providers[id].enabled,true);t.applyScenario('normal');
}
const config={id:'future',provider_kind:'custom',name:'future',base_url:'https://example.test/base',api_key_env:'OPENAI_API_KEY',protocol:'future-protocol',model:'',model_mode:'preserve',credential_mode:'env',auth_type:'bearer'};
await api.save(config,'create');await api.save({...config,name:'updated'},'update');assert.equal((await api.list()).providers.future.name,'updated');
const bytes=new Uint8Array([0,255,100,13,10]);const request={method:'PATCH',path:'/future/version?x=1&x=2',headers:{'Content-Type':'application/octet-stream','anthropic-version':'future-version','anthropic-beta':'future-beta','Connection':'X-Hop','X-Hop':'remove','X-New-Field':'keep','Authorization':'client-secret','X-TraceMason-Token':'local'},body:bytes};
const p=context.ProxyPlan.plan(config,request);assert.equal(p.body,bytes);assert.equal(p.method,'PATCH');assert.equal(p.url,'https://example.test/base/future/version?x=1&x=2');assert.equal(p.headers['anthropic-version'],'future-version');assert.equal(p.headers['X-New-Field'],'keep');assert.equal(p.headers['X-Hop'],undefined);assert.equal(p.headers.Authorization,undefined);assert.equal(p.headers['X-TraceMason-Token'],undefined);
const arbitrary='{"model":"future-arbitrary-model/version/type","unknown":{"new":true},"image":"data:..."}';assert.equal(context.ProxyPlan.plan(config,{method:'POST',path:'/new-api',body:arbitrary}).body,arbitrary);
assert.equal(context.ProxyPlan.plan({...config,auth_type:'x_api_key'},request).credential.header,'x-api-key');
assert.equal(context.ProxyPlan.plan(config,{method:'GET',path:'/realtime',headers:{Upgrade:'websocket'}}).transport,'websocket-tunnel');
for(const path of ['//evil.test','/../secret','/%2e%2e/secret','/%2fother'])assert.throws(()=>context.ProxyPlan.plan(config,{method:'GET',path}));
const etag=api.etag;await api.save({...config,id:'other'},'create');await assert.rejects(api.save({...config,id:'stale'},'create',etag),e=>e.status===412);
console.log('PASS: v0.1.1 Provider kind / API KEY accounts / Ops checks; arbitrary protocol/model; optional model; no probe gate; binary identity; unknown JSON identity; query/method/header preservation; auth isolation; WS plan; path confinement; CAS. Not a live proxy transport test.');

const secret='fake-key-for-contract-only-12345';
await api.save({...config,id:'managed',credential_mode:'managed',api_key_env:'',api_key:secret},'create');
let account=(await api.list()).providers.managed;assert.equal(account.has_api_key,true);assert.equal(account.configured,true);assert.equal(account.credential_revision,1);
assert.equal(JSON.stringify(t.state).includes(secret),false);assert.equal(JSON.stringify(t.trace).includes(secret),false);assert.equal(JSON.stringify(await api.list()).includes(secret),false);
await api.save({...config,id:'managed',credential_mode:'managed',api_key_env:''},'update');assert.equal((await api.list()).providers.managed.credential_revision,1);
await api.save({...config,id:'managed',credential_mode:'managed',api_key_env:'',api_key:'fake-replacement'},'update');assert.equal((await api.list()).providers.managed.credential_revision,2);
await assert.rejects(api.save({...config,id:'missing-managed',credential_mode:'managed',api_key_env:''},'create'),e=>e.field==='api_key');
console.log('PASS: direct API KEY / blank preserves / replace increments / no raw key in mock state, trace or DTO / missing key rejects. Prototype does not implement vault encryption.');
