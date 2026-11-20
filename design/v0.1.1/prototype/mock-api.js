/* Review-only HTTP-shaped transport. No provider requests or real credentials. */
(function(root){
'use strict';
const C=root.ProviderContract,clone=x=>JSON.parse(JSON.stringify(x)),key='tracemason-model-access-accounts-v0.1.1-reference';
const seed=()=>({version:1,providers:{
'codex-main':{provider_kind:'openai',name:'OpenAI 工作账号',base_url:'https://api.openai.com/v1',api_key_env:'OPENAI_API_KEY',model:'',protocol:'responses',model_mode:'preserve',credential_mode:'managed',has_api_key:true,credential_revision:1,auth_type:'bearer'},
'deepseek':{provider_kind:'deepseek',name:'DeepSeek 工作账号',base_url:'https://api.deepseek.com',api_key_env:'DEEPSEEK_API_KEY',model:'',protocol:'chat_completions',model_mode:'preserve',credential_mode:'managed',has_api_key:true,credential_revision:1,auth_type:'bearer'},
'claude':{provider_kind:'claude',name:'Claude 工作账号',base_url:'https://api.anthropic.com/v1',api_key_env:'ANTHROPIC_API_KEY',model:'',protocol:'messages',model_mode:'preserve',credential_mode:'managed',has_api_key:true,credential_revision:1,auth_type:'x_api_key'}},env:['OPENAI_API_KEY','DEEPSEEK_API_KEY','ANTHROPIC_API_KEY']});
class MockTransport{
 constructor(){try{this.state=JSON.parse(localStorage.getItem(key))||seed();}catch{this.state=seed();}this.scenario='normal';this.trace=[];this.delay=360;this.persist();}
 persist(){try{localStorage.setItem(key,JSON.stringify(this.state));}catch{/* file preview may block storage; memory mode remains functional */}}
 tag(){return '"demo-'+this.state.version+'"';}
 snapshot(){const s=clone(this.state);for(const p of Object.values(s.providers)){p.enabled=p.enabled!==false;p.configured=p.credential_mode==='managed'?!!p.has_api_key:s.env.includes(p.api_key_env);p.probe=p.configured?(p.probe||null):null;}return {providers:s.providers};}
 reset(empty=false){this.state=empty?{providers:{},version:1,env:['OPENAI_API_KEY','DEEPSEEK_API_KEY','ANTHROPIC_API_KEY']}:seed();this.scenario='normal';this.persist();}
 applyScenario(s){this.scenario=s;if(s==='expired'){for(const p of Object.values(this.state.providers))if(p.probe)p.probe.tested_at=new Date(Date.now()-86401000).toISOString();this.state.version++;this.persist();this.scenario='normal';}}
 async request(method,path,body,headers={}){
 const cleanBody=body?clone(body):null;if(cleanBody?.api_key)cleanBody.api_key='[REDACTED]';const entry={method,path,body:cleanBody,status:'pending'};this.trace.unshift(entry);this.trace=this.trace.slice(0,25);
 await new Promise(r=>setTimeout(r,this.delay));
 let result;try{
 const scenario=this.scenario;
 if(scenario==='offline')throw C.fault(503,'service_unavailable');
 if(path==='/api/session'&&method==='GET')result={token:'demo-session'};
 else if(path==='/api/providers'&&method==='GET')result=this.snapshot();
 else{
 if(headers['X-TraceMason-Token']!=='demo-session'||scenario==='session_expired'){this.scenario='normal';throw C.fault(403,'admin_token_required');}
 if(!headers['If-Match'])throw C.fault(428,'precondition_required');
 if(scenario==='conflict'){this.state.version++;this.persist();this.scenario='normal';}
 if(headers['If-Match']!==this.tag())throw C.fault(412,'config_changed');
 if(scenario==='write_error')throw C.fault(500,'config_write_failed');
 const id=body?.id??decodeURIComponent(path.split('/').pop());
 let p=Object.hasOwn(this.state.providers,id)?this.state.providers[id]:undefined;
 if(method==='POST'&&path==='/api/providers'){
 const item=C.normalize(body);
 if(!['create','update'].includes(body.intent))throw C.fault(400,'invalid_provider');
 if(body.intent==='create'&&p)throw C.fault(409,'provider_exists','id');
 if(body.intent==='update'&&!p)throw C.fault(404,'provider_not_found');
 
 if(item.credential_mode==='managed'&&!item.api_key&&!(p?.credential_mode==='managed'&&p.has_api_key))throw C.fault(400,'invalid_provider','api_key');
 item.has_api_key=item.credential_mode==='managed'&&(!!item.api_key||!!p?.has_api_key);item.credential_revision=(p?.credential_revision||0)+(item.api_key?1:0);delete item.api_key;
 item.enabled=p?.enabled!==false;delete item.id;Object.defineProperty(this.state.providers,id,{value:item,enumerable:true,writable:true,configurable:true});result='snapshot';
 }else{
 if(!p)throw C.fault(404,'provider_not_found');
 if(method==='DELETE'&&path.startsWith('/api/providers/')){
 delete this.state.providers[id];result='snapshot';
 }else if(method==='POST'&&path==='/api/providers/enabled'){
 if(typeof body.enabled!=='boolean')throw C.fault(400,'invalid_provider');p.enabled=body.enabled;result='snapshot';
 }else if(method==='POST'&&path==='/api/providers/test'){
 const state=C.connectionState({...p,configured:p.credential_mode==='managed'?!!p.has_api_key:this.state.env.includes(p.api_key_env)},this.state.active,id);
 
 if(state.key==='missing')throw C.fault(409,'provider_not_configured');
 // Network work is outside the repository lock. Commit requires original ETag.
 const capturedTag=this.tag();await new Promise(r=>setTimeout(r,650));
 if(capturedTag!==this.tag())throw C.fault(412,'config_changed');
 const errors={auth:'upstream_auth',rate_limit:'upstream_rate_limit',timeout:'upstream_timeout',incomplete:'upstream_failed'};
 const error=errors[scenario]||null;
 p.probe={ok:!error,tested_at:new Date().toISOString(),scope:'custom_request_only',http_status:error==='upstream_auth'?401:error==='upstream_rate_limit'?429:error==='upstream_timeout'?null:200,duration_ms:scenario==='timeout'?60000:860,error_code:error};
 result=clone(p.probe);
 }else throw C.fault(404,'provider_not_found');
 }
 this.state.version++;this.persist();if(result==='snapshot')result=this.snapshot();
 if(scenario==='lost_response'){this.scenario='normal';throw C.fault(0,'outcome_unknown');}
 }
 entry.status=200;return {status:200,headers:{ETag:this.tag()},body:clone(result)};
 }catch(e){entry.status=e.status||0;return {status:e.status||0,headers:{ETag:this.tag()},body:{error:{code:e.code||'service_unavailable',message:e.message,field:e.field||null}}};}
 }
 loadCredential(env){if(!this.state.env.includes(env))this.state.env.push(env);for(const p of Object.values(this.state.providers))if(p.api_key_env===env)delete p.probe;this.state.version++;this.persist();}
}
root.MockProviderTransport=MockTransport;
})(globalThis);
