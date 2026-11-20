/* Local review engine; no fetch, remote model, telemetry, or original-value persistence. */
(() => {
'use strict';
const definitions={personal:{label:'个人信息',token:'个人信息'},account:{label:'账号与密码',token:'账号凭据'},server:{label:'服务器登录信息',token:'服务器信息'},key:{label:'API Key 与访问令牌',token:'API_KEY'}};
const encoder=new TextEncoder();
const patterns=[
 {category:'account',rule:'VERIFICATION_CODE_CONTEXT',label:'验证码',re:/(?:验证码|校验码|one_time_password|otp|verification_code)["']?\s*(?:为|是|[:=：])\s*["']?([^\s"'，,;；。}\]]+)/gi,group:1},
 {category:'personal',rule:'HOME_DIRECTORY_IDENTITY',label:'本机用户',re:/(?:\/Users\/|\/home\/)([^/\s"']+)/g,group:1},
 {category:'account',rule:'ENV_USER',label:'账号',re:/(?:DB_USER|SSH_USER|LOGIN_USER)\s*=\s*([^\s"'，,;；。}\]]+)/gi,group:1},
 {category:'server',rule:'ENV_HOST',label:'服务器地址',re:/(?:DB_HOST|SSH_HOST|SERVER_HOST)\s*=\s*([^\s"'，,;；。}\]]+)/gi,group:1},
 {category:'personal',rule:'PII_EMAIL',label:'邮箱',re:/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi},
 {category:'personal',rule:'PII_CN_PHONE',label:'手机号',re:/(?<!\d)(?:\+86[- ]?)?1[3-9]\d{9}(?!\d)/g},
 {category:'personal',rule:'PII_CN_ID',label:'身份证',re:/(?<![\dA-Za-z])[1-9]\d{5}(?:19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dXx](?![\dA-Za-z])/g},
 {category:'key',rule:'KEY_PREFIX',label:'API_KEY',re:/\b(?:sk-(?:proj-|ant-)?|rk-|ghp_|github_pat_|AKIA)[A-Za-z0-9_-]{12,}/g},
 {category:'key',rule:'AUTH_BEARER',label:'访问令牌',re:/\bBearer\s+([A-Za-z0-9._~+/=-]{8,})/gi,group:1},
 {category:'server',rule:'PRIVATE_KEY_BLOCK',label:'私钥',re:/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g},
 {category:'account',rule:'CREDENTIAL_CONTEXT',label:'密码',re:/(?:密码|口令|password|passwd|pwd|secret)["']?\s*(?:为|是|[:=：])\s*["']?([^\s"'，,;；。}\]]+)/gi,group:1},
 {category:'account',rule:'ACCOUNT_CONTEXT',label:'账号',re:/(?:账号|帐号|用户名|username|user_name|login_user)["']?\s*(?:为|是|[:=：])\s*["']?([^\s"'，,;；。}\]]+)/gi,group:1},
 {category:'key',rule:'TOKEN_CONTEXT',label:'API_KEY',re:/(?:api[_ -]?key|access[_ -]?token|client[_ -]?secret|token)["']?\s*(?:为|是|[:=：])\s*["']?([^\s"'，,;；。}\]]+)/gi,group:1},
 {category:'server',rule:'SERVER_CONTEXT',label:'服务器地址',re:/(?:服务器(?:地址|IP)?|主机(?:地址)?|server[_ -]?(?:host|ip)|hostname|host)["']?\s*(?:为|是|[:=：])\s*["']?([^\s"'，,;；。}\]]+)/gi,group:1},
 {category:'server',rule:'SSH_LOGIN',label:'SSH登录',re:/\b(?:ssh|scp)\s+(?:-p\s+\d+\s+)?([^\s;，。]+@[^\s;，。]+)/g,group:1},
 {category:'server',rule:'CONNECTION_URL',label:'连接信息',re:/\b(?:ssh|postgres(?:ql)?|mysql|redis|mongodb(?:\+srv)?):\/\/[^\s"'<>]+/gi},
 {category:'personal',rule:'NAME_CONTEXT',label:'姓名',re:/(?:姓名|联系人)["']?\s*(?:为|是|[:=：])\s*["']?([^\s"'，,;；。}\]]+)/g,group:1},
 {category:'personal',rule:'ADDRESS_CONTEXT',label:'地址',re:/(?:家庭住址|家庭地址|收货地址)["']?\s*(?:为|是|[:=：])\s*["']?([^\n"'，,;；。}\]]+)/g,group:1}
];
const keyFields={password:['account','密码'],passwd:['account','密码'],pwd:['account','密码'],secret:['account','密码'],username:['account','账号'],user_name:['account','账号'],login:['account','账号'],api_key:['key','API_KEY'],apikey:['key','API_KEY'],access_token:['key','访问令牌'],token:['key','访问令牌'],authorization:['key','访问令牌'],private_key:['server','私钥'],hostname:['server','服务器地址'],server_ip:['server','服务器地址'],host:['server','服务器地址'],name:['personal','姓名'],full_name:['personal','姓名'],address:['personal','地址']};
const protocols=['responses','chat','messages'];
function duplicateKeys(text){
 const stack=[];
 for(let i=0;i<text.length;i++){
  const c=text[i];if(c==='{'||c==='['){stack.push(c==='{'?new Set():null);continue;}if(c==='}'||c===']'){stack.pop();continue;}
  if(c!=='"')continue;const start=i++;for(;i<text.length;i++){if(text[i]==='\\'){i++;continue;}if(text[i]==='"')break;}
  let next=i+1;while(/\s/.test(text[next]||'')&&next<text.length)next++;
  if(text[next]===':'&&stack.at(-1) instanceof Set){const key=JSON.parse(text.slice(start,i+1));if(stack.at(-1).has(key))return true;stack.at(-1).add(key);}
 }
 return false;
}
function protect(raw,{protocol='chat',format='text',model='custom-model',policy,registry}={}){
 const began=performance.now(),budget=policy.deadline_ms||1000,enabled=new Set(policy.categories),findings=[],values=new Map(),counters={};
 const blocked=reason=>({action:'blocked',reason,findings:findings.map(({value,...f})=>f),output:null,policy_revision:policy.revision,elapsed_ms:Math.round(performance.now()-began),coverage:'incomplete'});
 if(!protocols.includes(protocol))return blocked('unsupported_protocol');
 if(encoder.encode(raw).length>policy.max_kib*1024)return blocked('request_too_large');
 let request;
 try{request=format==='json'?JSON.parse(raw):protocol==='responses'?{model,input:raw}:protocol==='messages'?{model,max_tokens:1024,messages:[{role:'user',content:raw}]}:{model,messages:[{role:'user',content:raw}]};}catch{return blocked('invalid_json');}
 if(format==='json'&&duplicateKeys(raw))return blocked('duplicate_json_key');
 if(!request||Array.isArray(request)||typeof request!=='object')return blocked('invalid_request');
 if(protocol==='responses'&&!('input'in request))return blocked('invalid_request');
 if(protocol!=='responses'&&!Array.isArray(request.messages))return blocked('invalid_request');
 if(encoder.encode(JSON.stringify(request)).length>policy.max_kib*1024)return blocked('request_too_large');
 let unsafe=false,tooDeep=false,structuralLeak=false,keyLeak=false;
 const leaves=[];
 function walk(obj,path='',depth=0,field=''){
  if(depth>32){tooDeep=true;return;}
  if(typeof obj==='string'){leaves.push({path,field,text:obj,structural:['model','role','type','id','tool_call_id','call_id'].includes(field)||(field==='name'&&/\/(?:tools|tool_calls|function)\//.test(path)),key:false});return;}
  if(typeof obj==='number'||typeof obj==='boolean'){if(keyFields[field]||policy.fields.some(f=>f.key===field)){unsafe=true;}return;}
  if(Array.isArray(obj)){obj.forEach((x,i)=>walk(x,path+'/'+i,depth+1,field));return;}
  if(obj&&typeof obj==='object'){
   if(['image_url','input_image','image','input_audio','audio','file','input_file','document'].includes(obj.type))unsafe=true;
   for(const [k,v]of Object.entries(obj)){
    if(['image_url','file_id','file_data','audio','attachments'].includes(k)&&v)unsafe=true;
    leaves.push({path:path+'/[field]',field:'',text:k,structural:true,key:true});
    walk(v,path+'/'+k.replace(/~/g,'~0').replace(/\//g,'~1'),depth+1,k.toLowerCase());
   }
  }
 }
 walk(request);if(tooDeep)return blocked('nesting_limit');if(unsafe)return blocked('uninspectable_content');
 const reserved=new Set(leaves.flatMap(l=>l.text.match(/\[[^\]\n]+_\d+\]/g)||[]));
 function addValue(value,category,label,rule,path){
  if(!value||/^\[[^\]]+_\d+\]$/.test(value))return;
  if(!values.has(value)){let token=registry?.get(value);if(!token){do{token='['+label+'_'+(counters[label]=(counters[label]||0)+1)+']';}while(reserved.has(token)||[...(registry?.values()||[])].includes(token));registry?.set(value,token);}reserved.add(token);values.set(value,{category,label,rule,token,path});}
 }
 for(const leaf of leaves){
  if(performance.now()-began>budget)return blocked('detector_timeout');
  const custom=policy.fields.find(f=>f.key===leaf.field&&enabled.has(f.category));const field=custom?[custom.category,definitions[custom.category].token]:keyFields[leaf.field];
  if(!leaf.key&&!leaf.structural&&field&&enabled.has(field[0]))addValue(leaf.text,field[0],field[1],custom?'CUSTOM_FIELD':'SENSITIVE_FIELD',leaf.path);
  for(const customField of policy.fields){if(!enabled.has(customField.category))continue;const re=new RegExp('(?:^|[\\s{,])'+customField.key+'[\"\']?\\s*[:=：]\\s*[\"\']?([^\\s\"\'，,;；。}\\]]+)','gi');let m;while((m=re.exec(leaf.text)))addValue(m[1],customField.category,definitions[customField.category].token,'CUSTOM_FIELD',leaf.path);}
  for(const p of patterns){if(!enabled.has(p.category))continue;p.re.lastIndex=0;let m;while((m=p.re.exec(leaf.text))){const value=p.group?m[p.group]:m[0];addValue(value,p.category,p.label,p.rule,leaf.path);}}
 }
 const ordered=[...values.entries()].sort((a,b)=>b[0].length-a[0].length);
 const result=structuredClone(request);
 function setPath(path,value){const parts=path.slice(1).split('/').map(v=>v.replace(/~1/g,'/').replace(/~0/g,'~'));let obj=result;for(const k of parts.slice(0,-1))obj=obj[k];obj[parts.at(-1)]=value;}
 for(const leaf of leaves){
  const spans=[];
  for(const [value,match]of ordered){let from=0,at;while((at=leaf.text.indexOf(value,from))!==-1){from=at+value.length;if(/^[A-Za-z0-9_]{1,12}$/.test(value)&&(/[A-Za-z0-9_]/.test(leaf.text[at-1]||'')||/[A-Za-z0-9_]/.test(leaf.text[from]||'')))continue;if(!spans.some(s=>at<s.end&&from>s.start))spans.push({start:at,end:from,...match,value});}}
  if(!spans.length)continue;
  if(leaf.structural){leaf.key?keyLeak=true:structuralLeak=true;continue;}
  spans.sort((a,b)=>a.start-b.start);let text='',last=0;
  for(const hit of spans){text+=leaf.text.slice(last,hit.start)+hit.token;last=hit.end;findings.push({category:hit.category,rule_id:hit.rule,path:leaf.path,placeholder:hit.token,start:hit.start,end:hit.end});}
  text+=leaf.text.slice(last);setPath(leaf.path,text);
 }
 if(keyLeak)return blocked('sensitive_field_name');if(structuralLeak)return blocked('sensitive_protocol_field');
 if(performance.now()-began>budget)return blocked('detector_timeout');
 const output=JSON.stringify(result,null,2);
 // Verify residual plaintext values without confusing generated placeholders with source text.
 const check=structuredClone(result);
 function residual(node){if(typeof node==='string'){const clean=node.replace(/\[[^\]\n]+_\d+\]/g,'');return ordered.some(([value])=>{let pos=clean.indexOf(value);while(pos>=0){if(!/^[A-Za-z0-9_]{1,12}$/.test(value)||(!/[A-Za-z0-9_]/.test(clean[pos-1]||'')&&!/[A-Za-z0-9_]/.test(clean[pos+value.length]||'')))return true;pos=clean.indexOf(value,pos+value.length);}return false;});}if(Array.isArray(node))return node.some(residual);if(node&&typeof node==='object')return Object.values(node).some(residual);return false;}
 if(residual(check))return blocked('residual_sensitive_value');
 return {action:findings.length?'redacted':'unchanged',reason:null,findings,output,policy_revision:policy.revision,elapsed_ms:Math.round(performance.now()-began),coverage:'configured_text',ruleset:'local-review-1'};
}
window.PrivacyEngine={protect,definitions};
})();
