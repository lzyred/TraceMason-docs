'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)], C=ProviderContract;
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const transport=new ReviewTransport(), client=new ProviderClient(transport);
let profiles={},gatewayURL='',page=1;const checks=new Map();
let lastUpdated=null;let snapshot=null,filter='all',busy=false,stale=false,edit=null,probeId=null,confirmation=null;
const date=s=>s?new Date(s).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}):'尚未测试';
let toastTimer;function toast(text){clearTimeout(toastTimer);$('#status-message').textContent=text;toastTimer=setTimeout(()=>$('#status-message').textContent='',6500);}
function switchPage(){setNavigation(false);}
function setBusy(value){busy=value;render();for(const id of ['save-only','save-test','confirm-action'])$('#'+id).disabled=value;$('#provider-form').inert=value;}
function state(p,id){return C.connectionState(p,null,id);}
function providerName(p){return profiles[p.provider_kind]?.name||'自定义 Provider';}
function actions(id,p){const attr=`data-id="${escape(id)}" ${busy||stale?'disabled':''}`;const checking=checks.has(id);return `<div class="card-actions"><button data-action="connect" ${attr} class="connect-action">接入配置</button><button data-action="${checking?'cancel':p.configured?'test':'credential'}" ${attr}>${checking?'取消检查':p.configured?'检查连接':'配置凭据'}</button><button data-relay-settings="${escape(id)}">转发设置</button><button data-view-account="${escape(id)}">交互记录</button><details class="row-menu"><summary>操作 ▾</summary><div><button data-action="edit" ${attr}>编辑</button><button data-action="detail" ${attr}>详情</button><button data-action="toggle" ${attr}>${p.enabled===false?'启用':'停用'}</button><button data-action="delete" ${attr}>删除</button></div></details></div>`;}

function render(){
 $('#new-provider').disabled=busy||stale||!snapshot;$('#refresh').disabled=busy;
 if(!snapshot)return;const entries=Object.entries(snapshot.providers),q=$('#search').value.trim().toLowerCase();$('#total-count').textContent=entries.length;
 let rows=entries.filter(([id,p])=>(!q||[id,p.name,p.base_url,providerName(p)].join(' ').toLowerCase().includes(q))&&(!$('#platform-filter').value||p.provider_kind===$('#platform-filter').value)&&(filter==='all'||filter==='disabled'&&p.enabled===false||filter==='ready'&&p.enabled!==false||filter==='attention'&&(!p.configured||p.probe?.ok===false)));
 const total=rows.length, order=$('#sort-order').value;
 if(order==='name')rows.sort((a,b)=>a[1].name.localeCompare(b[1].name,'zh-CN'));
 if(order==='checked')rows.sort((a,b)=>(Date.parse(b[1].probe?.tested_at)||0)-(Date.parse(a[1].probe?.tested_at)||0));
 const size=Number($('#page-size').value),pages=Math.max(1,Math.ceil(total/size));page=Math.min(page,pages);rows=rows.slice((page-1)*size,page*size);
 $('#page-number').textContent=`${page} / ${pages}`;$('#page-prev').disabled=page===1;$('#page-next').disabled=page===pages;
 $('#list-summary').textContent=`${total} 个账号`;

 $('#connection-list').innerHTML=rows.length?`<div class="table-wrapper"><table><thead><tr><th>账号名称</th><th>平台 / 类型</th><th>API 地址</th><th>状态</th><th>最近检查 / 延迟</th><th class="actions-heading">操作</th></tr></thead><tbody>${rows.map(([id,p])=>`<tr data-provider="${escape(id)}"><td><button class="account-name" data-action="detail" data-id="${escape(id)}">${escape(p.name)}</button><small>${escape(id)}</small></td><td><span class="platform ${escape(p.provider_kind)}">${escape(providerName(p))}</span><small>API Key</small></td><td><code class="endpoint">${escape(p.base_url)}</code><small>${p.configured?'凭据已配置':'凭据未配置'}</small></td><td><span class="badge ${p.enabled===false?'neutral':'good'}">${p.enabled===false?'已停用':'已启用'}</span></td><td><span class="${p.probe?.ok===false?'error-text':''}">${p.probe?(p.probe.ok?'通过':'失败'):'未检查'}</span>${p.probe?`<span class="check-latency">${p.probe.duration_ms} ms</span>`:''}<small>${p.probe?date(p.probe.tested_at):'—'}</small>${p.probe?.error_code?`<button class="error-detail" data-action="test-detail" data-id="${escape(id)}">${escape(C.labels[p.probe.error_code]||p.probe.error_code)} ↗</button>`:''}</td><td>${actions(id,p)}</td></tr>`).join('')}</tbody></table></div>`:`<div class="empty"><div class="empty-symbol">◇</div><h2>${entries.length?'没有匹配账号':'还没有配置账号'}</h2><p>添加上游 API 凭据，开始管理你的接入。</p><button id="${entries.length?'clear-filter':'empty-add'}" class="primary">${entries.length?'清除筛选':'添加 Provider 账号'}</button></div>`;
 $('#ops-updated').textContent=lastUpdated?'最后成功刷新：'+date(lastUpdated)+(stale?' · 数据可能已过期':''):'尚未刷新';

}
function fail(e,target='#page-error'){
 const el=$(target);el.hidden=false;el.innerHTML=`<span>${escape(e.message)}</span>`;
 if([0,403,412,428,503].includes(e.status)){stale=true;if(target==='#form-error')$('#draft-recovery').hidden=false;else el.innerHTML+='<button id="recover" class="quiet">重新同步</button>';}
 render();
}
async function refresh({quiet=false}={}){if(busy)return false;setBusy(true);try{if(!Object.keys(profiles).length){const catalog=await client.request('GET','/api/provider-profiles');profiles=catalog.profiles;gatewayURL=catalog.gateway_url;renderCatalog();}snapshot=await client.list();lastUpdated=new Date().toISOString();stale=false;$('#page-error').hidden=true;if(!quiet)toast('已读取服务端最新状态');return true;}catch(e){fail(e);return false;}finally{setBusy(false);}}
function draftValues(){return Object.fromEntries(new FormData($('#provider-form')));}
function draftDirty(){return edit&&JSON.stringify(draftValues())!==edit.original;}
function close(id){if(busy&&['editor','confirmation'].includes(id))return;if(id==='editor'&&draftDirty()){$('#discard').showModal();return;}if(id==='editor')$('#provider-form').elements.api_key.value='';$('#'+id).close();}
function credentialPreview(){const env=$('#provider-form').elements.api_key_env.value.trim();const loaded=Object.values(snapshot.providers).some(p=>p.api_key_env===env&&p.configured);$('#credential-preview').textContent=loaded?'此变量已由服务进程加载。保存后即可使用，测试可选。':'保存后将检查服务端凭据状态；新增变量需要设置并重启服务。';}
function openEditor(id,template='custom'){if(busy||stale)return;const p=snapshot.providers[id];$('#provider-form').reset();$('#provider-form').elements.api_key.type='password';$('#key-visibility').textContent='显示输入';let values=p?{id,...p}:{id:'',name:'',base_url:'',api_key_env:'',credential_mode:'managed',model:'',protocol:'responses',model_mode:'preserve',auth_type:'bearer',provider_kind:'custom'};
 if(!p){const profile=profiles[template]||profiles.openai;values={...values,...profile,provider_kind:template,name:profile.name+' 账号',id:template+'-'+crypto.randomUUID().slice(0,8)};}
 $('#account-advanced').open=false;
 for(const k of ['id',...C.fields])$('#provider-form').elements[k].value=values[k];
 $('#provider-form').elements.id.readOnly=!!p;$('#editor-title').textContent=p?'编辑账号配置':'添加账号配置';
 $('#provider-form').elements.api_key.value='';$('#provider-form').elements.api_key.type='password';$('#key-visibility').textContent='显示输入';
 edit={id:p?id:null,etag:client.etag,original:JSON.stringify(draftValues())};clearErrors();credentialPreview();credentialFields();$('#editor-context').textContent=p?'仅连接或凭据变更会清除旧检查；修改名称保留结果。':'填写上游 API 地址与 API Key。';syncPlatform();$('#editor').showModal();
}
function clearErrors(){$$('#provider-form [data-error]').forEach(e=>{if(e.classList.contains('error'))e.textContent='';e.classList.remove('error');});$$('#provider-form [aria-invalid]').forEach(e=>e.removeAttribute('aria-invalid'));$('#form-error').hidden=true;$('#draft-recovery').hidden=true;}
$('#provider-form').onsubmit=async event=>{
 event.preventDefault();if(busy)return;clearErrors();let item;try{item=C.normalize(draftValues());}catch(e){if(e.field){const field=$('#provider-form').elements[e.field];field.setAttribute('aria-invalid','true');field.focus();const help=$(`[data-error="${e.field}"]`);if(help){help.textContent=e.message;help.classList.add('error');}}return;}
 if(item.credential_mode==='managed'&&!item.api_key&&!(edit.id&&snapshot.providers[edit.id]?.credential_mode==='managed'&&snapshot.providers[edit.id]?.has_api_key)){const help=$('[data-error=api_key]');help.textContent='新账号请填写上游 API Key。';help.classList.add('error');$('#provider-form').elements.api_key.focus();return;}
 const testAfter=event.submitter?.value==='test';setBusy(true);
 try{snapshot=await client.save(item,edit.id?'update':'create',edit.etag);stale=false;edit=null;$('#provider-form').elements.api_key.value='';$('#editor').close();switchPage('connections');toast('账号配置已保存。');if(testAfter){if(!snapshot.providers[item.id].configured)openCredentialGuide(item.id);else openProbe(item.id,true);}}
 catch(e){fail(e,'#form-error');if(e.field){const help=$(`[data-error="${e.field}"]`);if(help){help.textContent=e.message;help.classList.add('error');}}}
 finally{setBusy(false);}
};
function openProbe(id,fromSave=false){probeId=id;$('#probe-cancel').hidden=!checks.has(id);const p=snapshot.providers[id],s=state(p,id);if(!p)return;$('#probe-title').textContent='检查账号连接';$('#custom-probe').open=false;$('#check-model').value=p.model||'';$('#check-prompt').value='Reply OK.';const profile=profiles[p.provider_kind];$('#probe-path').value=profile.path;$('#probe-method').value='POST';$('#probe-headers').value=JSON.stringify(profile.headers,null,2);$('#probe-body').value=JSON.stringify({...profile.sample,model:p.model||'YOUR_MODEL'},null,2);$('#probe-target').innerHTML=`<div class="probe-identity"><div class="provider-logo">↗</div><div><b>${escape(p.name)}</b><span>${escape(p.model||'模型由请求指定')}</span></div></div><div class="probe-destination">${escape(p.base_url)}</div>`;
 $('#probe-content').innerHTML=`<div class="probe-steps"><span>凭据检查</span><b>→</b><span>流式请求</span><b>→</b><span>HTTP 完成</span></div><div class="inline-note">我们会发送一次简短请求，检查 HTTP 请求是否成功。实际使用时会产生少量模型用量。</div>${['missing','unsupported'].includes(s.key)?`<div class="result-box bad"><h3>${s.label}</h3><p>${escape(s.reason)}</p></div>`:''}`;
 $('#probe-run').disabled=checks.has(id);$('#probe-run').hidden=['missing','unsupported'].includes(s.key);$('#probe-run').textContent='发送测试请求';if(!$('#probe').open)$('#probe').showModal();
}
$('#probe-run').onclick=async()=>{
 const id=probeId;if(checks.has(id)||stale)return;
 if(!$('#custom-probe').open){if(!$('#check-model').value.trim()){$('#check-model').setCustomValidity('填写任意模型名');$('#check-model').reportValidity();return;}syncSimpleCheck();}
 let headers;try{headers=JSON.parse($('#probe-headers').value||'{}');}catch{toast('请求头 JSON 格式无效');return;}
 const controller=new AbortController();checks.set(id,controller);$('#probe-run').disabled=true;$('#probe-cancel').hidden=false;render();
 $('#probe-content').textContent='正在检查，可关闭弹窗继续管理其他账号，或取消检查。';
 try{const result=await client.test(id,{method:$('#probe-method').value,path:$('#probe-path').value,headers,body:$('#probe-body').value},controller.signal);
 snapshot=await client.list();lastUpdated=new Date().toISOString();
 if(probeId===id)$('#probe-content').innerHTML=`<div class="result-box ${result.ok?'':'bad'}"><h3>${result.ok?'HTTP 检查通过':'检查未通过'}</h3><p>${result.ok?'本次 HTTP 响应读取完成。':escape(C.labels[result.error_code]||result.error_code)}</p><dl class="kv"><dt>HTTP / 耗时</dt><dd>${result.http_status??'—'} / ${result.duration_ms} ms</dd><dt>请求路径</dt><dd>${escape(result.path)}</dd><dt>请求 ID</dt><dd>${escape(result.request_id||'未返回')}</dd></dl>${result.batch_results?.length>1?`<div class="batch-results">${result.batch_results.map(r=>`<p>${r.request_id?`<button data-open-request="${escape(r.request_id)}">${escape(r.request_id)}</button>`:'未追踪请求'} · ${escape(r.error_code||'完成')}</p>`).join('')}</div>`:''}${result.untracked?'<p>本次转发已执行，但观测容量已满，没有请求记录。</p>':''}${result.request_id?`<button data-open-request="${escape(result.request_id)}">查看本次请求 →</button>`:''}</div>`;
 }catch(e){if(probeId===id)$('#probe-content').textContent=e.name==='AbortError'?'检查已取消，不影响账号启用。':e.message;}
 finally{checks.delete(id);if(probeId===id){$('#probe-run').disabled=false;$('#probe-cancel').hidden=true;}render();}
};
$('#probe-cancel').onclick=()=>checks.get(probeId)?.abort();

function openConfirmation(kind,id){if(busy||stale)return;const p=snapshot.providers[id];confirmation={kind:'delete',id,etag:client.etag};$('#confirm-action').textContent='删除账号';$('#confirm-action').className='danger';$('#confirm-title').textContent='删除这个账号？';$('#confirm-body').innerHTML=`<h3>${escape(p.name)}</h3><p class="subtle">删除账号配置，检查记录与操作记录保留。</p>`;$('#confirmation').showModal();}
$('#confirm-action').onclick=async()=>{if(busy||!confirmation)return;setBusy(true);try{snapshot=await client.remove(confirmation.id,confirmation.etag);$('#confirmation').close();if($('#detail').open)$('#detail').close();toast('账号已删除。');}catch(e){fail(e);}finally{setBusy(false);}};
let detailId=null,detailTab='overview',credentialTarget=null;
function openDetail(id){detailId=id;detailTab='overview';renderDetail();$('#detail').showModal();}
function renderDetail(){const id=detailId,p=snapshot.providers[id],status=state(p,id);if(!p)return;$('#detail-title').textContent=p.name;$$('[data-detail-tab]').forEach(b=>b.classList.toggle('selected',b.dataset.detailTab===detailTab));
 const overview=`<div class="detail-heading"><div class="provider-logo">↗</div><div><b>${escape(p.model||'模型由请求指定')}</b><span>${p.enabled===false?'已停用':'已启用'} · ${escape(status.label)}</span></div></div><dl class="kv"><dt>独立代理入口</dt><dd><code>${escape(gatewayURL)}/proxy/${escape(id)}/</code><small> · 与其他连接同时可用</small></dd><dt>API 根地址</dt><dd>${escape(p.base_url)}</dd><dt>协议</dt><dd>${escape(p.protocol)}</dd><dt>连接 ID</dt><dd>${escape(id)}</dd><dt>转发方式</dt><dd>请求原样转发</dd><dt>API KEY</dt><dd>${p.credential_mode==='managed'?(p.has_api_key?'已配置 · 不回显':'未配置'):escape(p.api_key_env)+' · 环境变量'}</dd><dt>凭据版本</dt><dd>${p.credential_revision||'—'}</dd><dt>凭据状态</dt><dd>${p.configured?'已加载':'未加载'} ${!p.configured?`<button class="text-button" data-action="credential" data-id="${escape(id)}">准备凭据 →</button>`:''}</dd></dl>`;
 const probe=p.probe;const test=probe?`<div class="test-outcome ${probe.ok?'passed':'failed'}"><span>${probe.ok?'✓':'!'}</span><h3>${probe.ok?'自定义请求测试通过':'上次测试未通过'}</h3><p>${probe.ok?escape(status.reason):escape(C.labels[probe.error_code]||'响应未完成')}</p></div><dl class="kv"><dt>测试时间</dt><dd>${date(probe.tested_at)}</dd><dt>响应耗时</dt><dd>${probe.duration_ms} ms</dd><dt>HTTP 状态</dt><dd>${probe.http_status??'未收到响应'}</dd><dt>请求路径</dt><dd>${escape(probe.path||'—')}</dd><dt>请求 ID</dt><dd>${escape(probe.request_id||'未返回')}</dd><dt>结果范围</dt><dd>仅本次测试，不限制其他请求</dd></dl><p class="subtle">自定义请求测试不代表所有客户端能力均已验证。</p>`:'<div class="detail-no-test"><span>◷</span><h3>还没有测试记录</h3><p>完成一次连接测试，查看模型是否可以响应。</p></div>';
 $('#detail-body').innerHTML=(detailTab==='overview'?overview:test)+`<div class="detail-bottom">${actions(id,p)}</div>`;
}
function openCredentialGuide(id){if(id&&snapshot.providers[id].credential_mode==='managed'){openEditor(id);return;}credentialTarget=id||null;const env=id?snapshot.providers[id].api_key_env:$('#provider-form').elements.api_key_env.value.trim();$('#guide-env').textContent=env||'YOUR_PROVIDER_KEY';$('#guide-result').textContent='';$('#copy-env').textContent='复制名称';$('#credential-recheck').textContent=id?'我已设置，重新检查':'返回配置';$('#credential-guide').showModal();}
$('#credential-help').onclick=()=>openCredentialGuide();
$('#credential-recheck').onclick=async()=>{if(!credentialTarget){$('#credential-guide').close();return;}const button=$('#credential-recheck');button.disabled=true;button.textContent='正在检查…';const ok=await refresh({quiet:true});button.disabled=false;button.textContent='我已设置，重新检查';if(!ok){$('#guide-result').textContent='暂时无法连接服务，请确认服务已启动。';return;}const env=$('#guide-env').textContent;const loaded=Object.values(snapshot.providers).some(p=>p.api_key_env===env&&p.configured);if(loaded){$('#guide-result').textContent='✓ 凭据已加载';if(credentialTarget){$('#credential-guide').close();openProbe(credentialTarget);}}else $('#guide-result').textContent='尚未检测到此变量。请确认设置在服务进程环境中，并已重启服务。';};
$('#copy-env').onclick=async()=>{try{await navigator.clipboard.writeText($('#guide-env').textContent);$('#copy-env').textContent='已复制';}catch{$('#copy-env').textContent='请选中名称复制';}};
$('#draft-refresh').onclick=async()=>{if(await refresh({quiet:true})){edit.etag=client.etag;$('#draft-recovery').hidden=true;$('#form-error').hidden=true;toast('最新状态已加载；输入已保留，请检查后重新保存。');}};
$('#new-provider').onclick=()=>openEditor(undefined,'openai');$('#refresh').onclick=()=>refresh();$('#search').oninput=()=>{page=1;render();};$('#provider-form').elements.api_key_env.oninput=credentialPreview;
$('#discard-confirm').onclick=()=>{$('#discard').close();$('#provider-form').elements.api_key.value='';$('#editor').close();edit=null;};
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.page)switchPage(b.dataset.page);if(b.dataset.close)close(b.dataset.close);if(b.dataset.filter){page=1;filter=b.dataset.filter;$$('[data-filter]').forEach(el=>el.classList.toggle('selected',el===b));render();}if(b.id==='recover')refresh();if(b.id==='clear-filter'){$('#search').value='';$('#platform-filter').value='';filter='all';$$('[data-filter]').forEach(el=>el.classList.toggle('selected',el.dataset.filter==='all'));render();}if(b.id==='empty-add')openEditor(undefined,'openai');if(b.dataset.detailTab){detailTab=b.dataset.detailTab;renderDetail();}if(b.dataset.action){const {action,id}=b.dataset;if(action==='cancel'){checks.get(id)?.abort();return;}if(action==='connect'){openConnect(id);return;}if(action==='detail')return openDetail(id);if(action==='test-detail'){openDetail(id);detailTab='test';renderDetail();return;}if($('#detail').open)$('#detail').close();if(action==='edit')openEditor(id);if(action==='toggle')toggleAccount(id);if(action==='credential')openCredentialGuide(id);if(action==='test')openProbe(id);if(action==='delete')openConfirmation(action,id);}});
for(const id of ['editor','probe','confirmation','credential-guide'])$('#'+id).addEventListener('cancel',e=>{e.preventDefault();close(id);});

refresh({quiet:true});

document.addEventListener("visibilitychange",()=>{if(!document.hidden&&!busy&&!document.querySelector("dialog[open]"))refresh({quiet:true});});

async function toggleAccount(id){if(busy||stale)return;const enabled=snapshot.providers[id].enabled===false;setBusy(true);try{snapshot=await client.setEnabled(id,enabled);toast(enabled?'账号已启用。':'账号已停用，新请求不再使用此账号。');}catch(e){fail(e);}finally{setBusy(false);}}


function credentialFields(){const f=$('#provider-form').elements,managed=f.credential_mode.value==='managed',p=edit?.id?snapshot.providers[edit.id]:null;$('#managed-key-field').hidden=!managed;$('#env-key-field').hidden=managed;$('#credential-help').hidden=managed;$('#credential-preview').hidden=managed;$('#key-state').textContent=p?.has_api_key?'已配置 API KEY。留空保留；填写新值则替换，保存后不回显。':'评审模式：仅模拟凭据状态，不保存密钥。';f.api_key.placeholder=p?.has_api_key?'留空保留原 Key，填写则替换':'填写上游 API Key';}
$('#provider-form').elements.credential_mode.onchange=credentialFields;
$('#key-visibility').onclick=()=>{const input=$('#provider-form').elements.api_key;input.type=input.type==='password'?'text':'password';$('#key-visibility').textContent=input.type==='password'?'显示输入':'隐藏输入';};
function syncSimpleCheck(){const p=snapshot.providers[probeId],sample=structuredClone(profiles[p.provider_kind].sample);sample.model=$('#check-model').value.trim();if('input' in sample)sample.input=$('#check-prompt').value;if(sample.messages)sample.messages[0].content=$('#check-prompt').value;$('#probe-body').value=JSON.stringify(sample,null,2);}
$('#check-model').oninput=()=>{$('#check-model').setCustomValidity('');syncSimpleCheck();};$('#check-prompt').oninput=syncSimpleCheck;
setInterval(()=>{if($('#ops-auto').checked&&!document.hidden&&!busy&&!document.querySelector('dialog[open]'))refresh({quiet:true});},30000);

function syncPlatform(){const f=$('#provider-form').elements;$$('[data-platform]').forEach(b=>{b.classList.toggle('selected',b.dataset.platform===f.provider_kind.value);b.disabled=!!edit?.id;});}
function renderCatalog(){
 $('.platform-control').innerHTML=Object.entries(profiles).map(([key,p])=>`<button type="button" data-platform="${escape(key)}">${escape(p.name)}</button>`).join('');
 $('#platform-filter').innerHTML='<option value="">全部平台</option>'+Object.entries(profiles).map(([key,p])=>`<option value="${escape(key)}">${escape(p.name)}</option>`).join('');
 $$('[data-platform]').forEach(b=>b.onclick=()=>{const f=$('#provider-form').elements,k=b.dataset.platform,p=profiles[k];if(f.name.value===profiles[f.provider_kind.value]?.name+' 账号')f.name.value=p.name+' 账号';f.provider_kind.value=k;f.base_url.value=p.base_url;f.auth_type.value=p.auth_type;f.protocol.value=p.protocol;syncPlatform();});
}
function openConnect(id){const p=snapshot.providers[id],profile=profiles[p.provider_kind],url=gatewayURL+'/proxy/'+id+'/';$('#connection-url').value=url;const payload={...profile.sample,model:'YOUR_MODEL'};const quote=value=>"'"+value.replaceAll("'","'\\''")+"'";$('#connection-example').textContent='curl '+quote(url.replace(/\/$/,'')+profile.path)+' '+Object.entries(profile.headers).map(([k,v])=>'-H '+quote(k+': '+v)).join(' ')+' --data '+quote(JSON.stringify(payload));$('#connect-guide').showModal();}
async function copyText(value){try{await navigator.clipboard.writeText(value);toast('已复制');}catch{toast('无法自动复制，请选中文字复制。');}}
$('#copy-url').onclick=()=>copyText($('#connection-url').value);$('#copy-example').onclick=()=>copyText($('#connection-example').textContent);
$('#page-prev').onclick=()=>{page--;render();};$('#page-next').onclick=()=>{page++;render();};$('#page-size').onchange=()=>{page=1;render();};$('#sort-order').onchange=()=>{page=1;render();};
$('#platform-filter').onchange=()=>{page=1;render();};

function setNavigation(open){document.body.classList.toggle('navigation-open',open);$('#navigation-backdrop').hidden=!open;$('#navigation-toggle').setAttribute('aria-expanded',String(open));$('#navigation-toggle').setAttribute('aria-label',open?'关闭导航':'打开导航');if(open)$('#main-navigation .nav-item').focus();else $('#navigation-toggle').focus();}
$('#navigation-toggle').onclick=()=>setNavigation(!document.body.classList.contains('navigation-open'));
$('#navigation-backdrop').onclick=()=>setNavigation(false);
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&document.body.classList.contains('navigation-open'))setNavigation(false);});
matchMedia('(max-width:700px)').addEventListener('change',()=>setNavigation(false));

window.addEventListener('review-reset',()=>{transport.mock.reset();refresh();});
