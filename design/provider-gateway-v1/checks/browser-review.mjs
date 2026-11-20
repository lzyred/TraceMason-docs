import {spawn} from 'node:child_process';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import os from 'node:os';
import path from 'node:path';
const profile=await fs.mkdtemp(path.join(os.tmpdir(),'tm-review-chrome-'));
const child=spawn(process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless=new','--remote-debugging-port=0','--no-first-run','--no-default-browser-check','--disable-background-networking','--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});
let socket;
try{
 const endpoint=await new Promise((resolve,reject)=>{let log='';const timer=setTimeout(()=>reject(Error('Chrome start timeout')),15000);child.stderr.on('data',b=>{log+=b;const m=log.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(m){clearTimeout(timer);resolve(m[1]);}});child.once('error',reject);});
 socket=new WebSocket(endpoint);await new Promise((r,j)=>{socket.onopen=r;socket.onerror=j;});
 let seq=0;const pending=new Map(),errors=[],external=[];
 socket.onmessage=e=>{const d=JSON.parse(e.data);if(d.id){const p=pending.get(d.id);if(p){pending.delete(d.id);d.error?p.reject(Error(JSON.stringify(d.error))):p.resolve(d.result);}}else if(d.method==='Runtime.exceptionThrown')errors.push(d.params.exceptionDetails.text);else if(d.method==='Network.requestWillBeSent'&&/^https?:/.test(d.params.request.url))external.push(d.params.request.url);};
 const call=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params,sessionId}));});
 const {targetId}=await call('Target.createTarget',{url:'about:blank'});const {sessionId}=await call('Target.attachToTarget',{targetId,flatten:true});
 const c=(method,params)=>call(method,params,sessionId);
 await c('Runtime.enable');await c('Page.enable');await c('Network.enable');
 const evaluate=async expression=>{const r=await c('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};

 const until=async expression=>{for(let i=0;i<150;i++){if(await evaluate(expression))return;await new Promise(r=>setTimeout(r,100));}throw Error('timeout '+expression);};
 await c('Page.navigate',{url:new URL('../index.html',import.meta.url).href});
 await until('document.body?.dataset.ready === "true" || !!document.body?.dataset.error');
 assert.equal(await evaluate('document.body.dataset.error'),undefined);
 assert.equal(await evaluate('document.querySelectorAll(".mermaid svg").length'),12);
 await c('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 let shot=await c('Page.captureScreenshot',{format:'png'});await fs.writeFile(fileURLToPath(new URL('../screenshots/architecture-1440.png',import.meta.url)),Buffer.from(shot.data,'base64'));
 await c('Emulation.setDeviceMetricsOverride',{width:390,height:1000,deviceScaleFactor:1,mobile:false});
 assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth'),'diagram portal mobile overflow');
 await c('Page.navigate',{url:new URL('../provenance.html',import.meta.url).href});
 await until('document.querySelectorAll(".mermaid svg").length === 2');
 await c('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await c('Page.navigate',{url:new URL('../prototype/index.html',import.meta.url).href});
 await until('document.readyState === "complete" && document.querySelectorAll("#provider-list article").length === 3');
 await evaluate(`document.querySelector('[data-provider=primary] [data-action=edit]').click()`);
 assert.equal(await evaluate('document.querySelector("#form").elements.id.value'),'primary-copy');
 await evaluate('document.querySelector("#form").requestSubmit()');
 assert.equal(await evaluate('document.querySelectorAll("#provider-list article").length'),4);
 assert.equal(await evaluate('document.querySelector("#active-name").textContent'),'Codex 主连接');
 await evaluate(`document.querySelector('[data-provider=primary-copy] [data-action=test]').click();document.querySelector('[data-provider=primary-copy] [data-action=activate]').click()`);
 assert.match(await evaluate('document.querySelector("#active-name").textContent'),/副本/);
 await evaluate(`document.querySelector('#expire').click()`);
 assert.equal(await evaluate('document.querySelector("[data-provider=primary] [data-action=activate]").disabled'),true);
 for(const scenario of ['failure','missing','success']){
 await evaluate(`document.querySelector('#scenario').value='${scenario}';document.querySelector('[data-provider=standby] [data-action=test]').click()`);
 assert.match(await evaluate('document.querySelector("#notice").textContent'),scenario==='success'?/测试通过/:/测试失败/);
 }
 await evaluate(`document.querySelector('[data-provider=standby] [data-action=edit]').click();document.querySelector('#form').elements.model.value='changed';document.querySelector('#form').requestSubmit()`);
 assert.equal(await evaluate('document.querySelector("[data-provider=standby] [data-action=activate]").disabled'),true);
 await evaluate(`document.querySelector('[data-page=sessions]').click();document.querySelector('#open-session').click();document.querySelector('#timeline [data-request]').click()`);
 assert.match(await evaluate('document.querySelector("#detail-content").textContent'),/工具结果/);
 await evaluate(`document.querySelector('[data-tab=request]').click();document.querySelector('#user-only').click()`);
 assert.equal(await evaluate('document.querySelector("#detail-content pre").textContent'),'修复 add 函数，保持测试不变。');
 await evaluate(`document.querySelector('[data-close=detail]').click();document.querySelector('[data-page=requests]').click();document.querySelector('[data-request=req-003]').click();document.querySelector('[data-tab=response]').click()`);
 assert.match(await evaluate('document.querySelector("#detail-badges").textContent'),/未到达/);
 assert.match(await evaluate('document.querySelector("#detail-content").textContent'),/response.completed/);
 await evaluate(`document.querySelector('[data-close=detail]').click();document.querySelector('[data-page=providers]').click();document.querySelector('#reset').click()`);
 for(const width of [1440,390]){await c('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth'),'overflow '+width);shot=await c('Page.captureScreenshot',{format:'png'});await fs.writeFile(fileURLToPath(new URL('../screenshots/desktop-'+width+'.png',import.meta.url)),Buffer.from(shot.data,'base64'));}
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 console.log('PASS: 12 Mermaid diagrams; active-copy/test/activate; expiry; failure/missing; edit invalidation; session timeline; backup reader; user-only text; independent EOF; 1440/390 layout; no JS errors or HTTP requests.');

}finally{if(socket)socket.close();child.kill('SIGTERM');}
