/* Model access v1 review contract. Shared by the prototype UI and mock boundary. */
(function(root){
'use strict';
const fields=['name','base_url','api_key_env','model','protocol','model_mode','auth_type','provider_kind','credential_mode'];
const labels={upstream_tls:'上游 TLS 证书验证失败。',upstream_unreachable:'无法连接上游，请检查地址与网络。',upstream_incomplete:'上游响应中断或长度不完整。',invalid_provider_id:'连接 ID 仅支持 1–64 位字母、数字、下划线和短横线。',invalid_provider:'请填写所有必填项，每项不超过 512 字符。',invalid_base_url:'使用 HTTPS 或本机 HTTP；地址不能包含凭据、查询参数、片段或空格。',invalid_key_env:'请输入环境变量名，不是密钥值。',invalid_protocol:'协议或模型策略无效。',provider_not_found:'连接已不存在，请刷新列表。',provider_exists:'连接 ID 已存在，请更换 ID。',active_provider_locked:'活动连接不可修改或删除，请另存后测试切换。',provider_not_configured:'服务进程未加载凭据。设置环境变量并重启服务，再刷新状态。',protocol_not_supported:'请求能力由上游判断，代理不按协议名称拦截。',probe_required:'尚未测试，可以直接使用代理或发送自定义测试。',probe_expired:'这是历史测试结果，不限制代理转发。',config_changed:'配置已被其他操作更新，请刷新后重试。',precondition_required:'缺少配置快照，请刷新后重试。',upstream_auth:'上游拒绝认证。检查服务端密钥后重新测试。',upstream_rate_limit:'上游限流或额度不足，稍后重试。',upstream_timeout:'测试超时，请检查地址与网络后重试。',upstream_failed:'上游请求未成功完成，请检查接口、模型与凭据。',config_write_failed:'配置写入失败，原有连接未改变。检查本地文件权限或磁盘。',service_unavailable:'无法连接本机服务。检查服务是否运行，然后重试。',admin_token_required:'管理会话已失效，请重新连接服务。',outcome_unknown:'连接中断，操作结果未知。先刷新服务状态，再决定是否重试。'};
function fault(status,code,field){const error=new Error(labels[code]||code);Object.assign(error,{status,code,field});return error;}
function normalize(input){const v={id:input.id};if(typeof v.id!=='string'||!(/^[A-Za-z0-9_-]{1,64}$/).test(v.id))throw fault(400,'invalid_provider_id','id');
for(const k of fields){if(typeof input[k]!=='string'||(!['model','api_key_env'].includes(k)&&!input[k].trim())||(k!=='model'&&input[k].length>512))throw fault(400,'invalid_provider',k);v[k]=input[k].trim();}
if(v.credential_mode==='env'&&!/^[A-Za-z_][A-Za-z0-9_]*$/.test(v.api_key_env))throw fault(400,'invalid_key_env','api_key_env');
if(!['openai','deepseek','claude','custom'].includes(v.provider_kind))throw fault(400,'invalid_provider','provider_kind');
if(v.model_mode!=='preserve'||!['bearer','x_api_key'].includes(v.auth_type))throw fault(400,'invalid_protocol','protocol');
try{const u=new URL(v.base_url);const local=u.hostname==='localhost'||u.hostname==='[::1]'||/^127\.(\d{1,3}\.){2}\d{1,3}$/.test(u.hostname);if(!u.hostname||u.username||u.password||v.base_url.includes('?')||v.base_url.includes('#')||/\s/.test(v.base_url)||!(u.protocol==='https:'||(u.protocol==='http:'&&local)))throw Error();}catch{throw fault(400,'invalid_base_url','base_url');}
if(!['managed','env'].includes(v.credential_mode))throw fault(400,'invalid_provider','credential_mode');if(input.api_key?.trim())v.api_key=input.api_key.trim();
v.base_url=v.base_url.replace(/\/+$/,'');return v;}
function connectionState(p,active,id,now=Date.now()){

if(!p.configured)return {key:'missing',label:'缺少凭据',tone:'warn',reason:labels.provider_not_configured};
if(!p.probe)return {key:'untested',label:'尚未测试',tone:'neutral',reason:labels.probe_required};
if(!p.probe.ok)return {key:'failed',label:'测试失败',tone:'bad',reason:labels[p.probe.error_code]||labels.upstream_failed};
if(now-Date.parse(p.probe.tested_at)>86400000)return {key:'expired',label:'历史测试',tone:'warn',reason:labels.probe_expired};
return {key:'ready',label:'检查通过',tone:'good',reason:'本次 HTTP 检查通过；不代表所有模型或能力均已验证。'};
}
root.ProviderContract={fields,labels,fault,normalize,connectionState};
})(globalThis);
