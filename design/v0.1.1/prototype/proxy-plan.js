/* Executable forwarding contract, not a running proxy server. */
(function(root){
'use strict';
function plan(config,{method,path,headers={},body}){
 // Work from a configured origin; request text cannot supply a new upstream host.
 if(typeof path!=='string'||!path.startsWith('/')||path.startsWith('//')||path.includes('#')||/[\r\n\\]/.test(path))throw Error('invalid_relative_path');
 const rawPath=path.split('?')[0];
 for(const segment of rawPath.split('/')){const decoded=decodeURIComponent(segment);if(decoded==='.'||decoded==='..'||decoded.includes('/')||decoded.includes('\\'))throw Error('invalid_relative_path');}
 const connection=Object.entries(headers).find(([k])=>k.toLowerCase()==='connection')?.[1]||'';
 const omit=new Set(['host','connection','keep-alive','proxy-authenticate','proxy-authorization','te','trailer','transfer-encoding','upgrade','content-length','authorization','x-api-key','x-tracemason-token',...connection.toLowerCase().split(',').map(s=>s.trim())]);
 const forwarded=Object.fromEntries(Object.entries(headers).filter(([k])=>!omit.has(k.toLowerCase())));
 return {method,url:config.base_url.replace(/\/+$/,'')+path,headers:forwarded,body,credential:{source:config.credential_mode==='managed'?'credential-store':'environment',account_id:config.id,environment:config.credential_mode==='managed'?undefined:config.api_key_env,header:config.auth_type==='x_api_key'?'x-api-key':'Authorization',prefix:config.auth_type==='x_api_key'?'':'Bearer '},transport:Object.entries(headers).some(([k,v])=>k.toLowerCase()==='upgrade'&&String(v).toLowerCase()==='websocket')?'websocket-tunnel':'http-stream'};
}
root.ProxyPlan={plan};
})(globalThis);
