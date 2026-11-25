const $=id=>document.getElementById(id);
const clients=[device('开发工作站',['openai-dev','claude-team','gemini-lab']),device('评审电脑',['openai-review'])];
const inventory={
 Codex:{installed:true,base:'https://api.openai.com/v1',model:'gpt-6.2-sol',path:'~/.codex/config.toml · ~/.codex/auth.json'},
 Claude:{installed:true,base:'https://api.anthropic.com',model:'默认',path:'~/.claude/settings.json'},
 Gemini:{installed:false,base:'',model:'',path:'~/.gemini/.env · ~/.gemini/settings.json'}
};
const names={Codex:'Codex',Claude:'Claude Code',Gemini:'Gemini CLI'};
const demoOutcomes={Codex:'成功',Claude:'成功',Gemini:'成功'};
const demoAddress='http://192.168.1.10:8769';
let local=null, selected=null, page='clients', side='admin';
function add(parent,tag,text=''){const el=document.createElement(tag);el.textContent=text;parent.append(el);return el}
function btn(p,text,fn,primary=false){const b=add(p,'button',text);if(primary)b.className='primary';b.onclick=()=>{try{fn()}catch(e){$('notice').textContent=e.message;if($('sheet').open){let out=$('fields').querySelector('output')||add($('fields'),'output');out.textContent=e.message}}};return b}
function field(p,text,value=''){const label=add(p,'label',text),i=add(label,'input');i.value=value;return i}
function section(title){const s=add($('view'),'section');if(title)add(s,'h2',title);return s}
function show(title){$('sheetTitle').textContent=title;$('fields').replaceChildren();if(!$('sheet').open)$('sheet').showModal();return $('fields')}
function finish(msg){$('sheet').close();render();$('notice').textContent=msg}
function detail(p,entries){const dl=add(p,'dl');for(const [label,value] of entries){add(dl,'dt',label);add(dl,'dd',value)}}
function status(c){return c.revoked?'已撤销':c.bound?'已绑定':'待绑定'}
function editor(c){
 const f=show(c?'编辑授权':'新建客户端'),n=field(f,'客户端名称',c?.name||'');const picks=[];
 for(const [id,[tool,label]] of Object.entries(accounts)){const l=add(f,'label'),x=add(l,'input');x.type='checkbox';x.checked=c?.grants.includes(id)||false;l.append(' '+names[tool]+' · '+label+' ('+id+')');picks.push([id,x])}
 btn(f,c?'保存':'创建并获取激活码',()=>{
  if(!n.value.trim())throw Error('请输入客户端名称');
  const grants=picks.filter(([,x])=>x.checked).map(([id])=>id);
  if(c){c.name=n.value.trim();c.grants=grants;sync(c);finish('授权已保存')}
  else{selected=device(n.value.trim(),grants);clients.push(selected);$('sheet').close();render();ticket(selected)}
 },true);
}
function ticket(c){
 const f=show('绑定到 '+c.name);detail(f,[['服务地址',demoAddress],['有效期','签发后 1 小时']]);const i=field(f,'一次性激活码',c.code);i.readOnly=true;
 btn(f,'复制激活码',async()=>{i.select();try{await navigator.clipboard.writeText(i.value);add(f,'output','已复制')}catch{add(f,'output','已选中，可直接复制')}});
}
function manage(){
 if(selected){
  const c=selected;btn($('action'),'返回列表',()=>{selected=null;render()});const s=section('设备身份');
  detail(s,[['客户端 ID',c.id],['状态',status(c)],['授权账号',c.grants.map(id=>accounts[id][1]+' / '+id).join('、')||'无']]);
  if(c.revoked)return;
  const row=add(s,'div');row.className='row';btn(row,'编辑授权',()=>editor(c));
  if(!c.bound&&hour<c.codeEnd)btn(row,'查看激活码',()=>ticket(c));
  for(const [label,revoke] of [[c.bound?'更换绑定设备':'重新签发激活码',false],['撤销身份',true]]){
   btn(row,label,()=>{const f=show(label);add(f,'p',revoke?'此身份的会话与临时 Key 将立即失效。':'旧绑定及激活码将失效，设备名称与授权账号保留。');btn(f,'确认'+label,()=>{unbind(c,revoke);finish('已更新设备身份');if(!revoke)ticket(c)},true)});
  }
  return;
 }
 btn($('action'),'＋ 新建客户端',()=>editor(null),true);
 const s=section('已登记客户端');s.classList.add('table');const table=add(s,'table'),head=add(table,'tr');for(const h of ['名称','授权账号','绑定状态',''])add(head,'th',h);
 for(const c of clients){const tr=add(table,'tr');add(tr,'td',c.name);add(tr,'td',c.grants.map(id=>accounts[id][1]).join('、')||'无');add(add(tr,'td'),'span',status(c)).className='status';btn(add(tr,'td'),'管理',()=>{selected=c;render()})}
}
function binding(){
 if(local?.bound){const s=section(local.name);detail(s,[['服务地址',local.address],['客户端 ID',local.id],['已授权账号',local.grants.map(id=>accounts[id][1]).join('、')||'无'],['临时凭据','第 '+local.current.n+' 代 · '+(hour>=local.current.end?'已到期':(local.current.end-hour)+' 小时后到期')],['自动轮换',local.next?'已领取第 '+local.next.n+' 代，等待工具切换与验证':'下次到期前自动续领']]);return}
 const s=section('连接私有服务器');
 if(local)add(s,'p','原绑定已失效，请向管理员领取新的激活码。');
 const addr=field(s,'服务地址',demoAddress),code=field(s,'一次性激活码');
 btn(s,'绑定这台设备',()=>{const c=clients.find(x=>x.code&&x.code===code.value.trim());if(!c)throw Error('激活码无效或已使用');activate(c,addr.value,code.value.trim());local=c;for(const name of Object.keys(names))c.tools[name].installed=inventory[name].installed;render();$('notice').textContent='已绑定。可在左侧工具页选择授权账号。'},true);
}
function config(name){
 const fixture=inventory[name],s=section('当前配置'),t=local?.tools[name];
 detail(s,[['安装状态',fixture.installed?'已安装':'未检测到'],['配置文件',fixture.path],['API 地址',t?.route?endpoint(name,t.route):fixture.base||'尚无配置'],['模型',t?.model||fixture.model||'尚无配置']]);
 if(!fixture.installed){add(s,'p','未检测到可执行文件，配置应用与验证暂不可用。');return}
 if(!local?.bound){btn(s,'连接服务器',()=>{page='binding';render()});return}
 const ids=local.grants.filter(id=>accounts[id][0]===name),p=section('服务器连接');
 if(!ids.length){add(p,'p',t.route?'当前账号授权已撤回，服务器将拒绝新请求。':'此设备未获该工具的账号授权。');return}
 const l=add(p,'label','授权账号'),choice=add(l,'select');for(const id of ids)choice.add(new Option(accounts[id][1]+' · '+id,id));if(ids.includes(t.route))choice.value=t.route;
 const model=field(p,'模型',t.route===choice.value?t.model:accounts[choice.value][2]);choice.onchange=()=>{model.value=accounts[choice.value][2]};
 btn(p,'预览配置变更',()=>{const id=choice.value,m=model.value.trim();if(!m)throw Error('请输入模型 ID');const f=show('应用到 '+names[name]);
 detail(f,[['账号',accounts[id][1]],['API 地址',(t.route?endpoint(name,t.route):fixture.base)+' → '+endpoint(name,id)],['模型',(t.model||fixture.model)+' → '+m],['凭据','设备专属七天临时 Key（已隐藏）']]);
 add(f,'pre',preview(name,id,m));btn(f,'应用到本机',()=>{apply(local,name,id,m);finish('演示配置已回读，CLI 请求待验证。')},true);
 },true).disabled=!writable(t);
 if(t.route){
  add(p,'p','本机配置第 '+t.written+' 代 · '+t.result);
  if(!local.grants.includes(t.route))add(p,'p','当前账号授权已撤回');
  else btn(p,'验证当前连接',()=>{verify(local,name,demoOutcomes[name]);render()});
 }
 if(t.activity!=='空闲已确认')add(p,'p','等待会话结束后应用配置');
}
function endpoint(name,id){return local.address+'/proxy/'+id+(name==='Codex'?'/v1':'')}
function preview(name,id,model){
 const url=endpoint(name,id);
 if(name==='Codex')return '~/.codex/config.toml\nmodel_provider = "TraceMason"\nmodel = '+JSON.stringify(model)+'\n[model_providers.TraceMason]\nname = "TraceMason"\nbase_url = '+JSON.stringify(url)+'\nwire_api = "responses"\nrequires_openai_auth = true\n\n~/.codex/auth.json\n{"OPENAI_API_KEY":"••••"}';
 if(name==='Claude')return JSON.stringify({env:{ANTHROPIC_BASE_URL:url,ANTHROPIC_AUTH_TOKEN:'••••',ANTHROPIC_MODEL:model}},null,2);
 return 'GOOGLE_GEMINI_BASE_URL='+url+'\nGEMINI_API_KEY=••••\nGEMINI_MODEL='+model;
}
function render(){
 const admin=side==='admin';$('notice').textContent='';document.body.classList.toggle('mini',!admin);
 $('brand').textContent=admin?'TraceMason':'TraceMason Mini';$('nav').replaceChildren();$('action').replaceChildren();$('view').replaceChildren();
 const entries=admin?[['clients','客户端管理']]:[['Codex','Codex'],['Claude','Claude Code'],['Gemini','Gemini CLI'],['binding','设备与服务器']];
 for(const [id,text] of entries){btn($('nav'),text,()=>{page=id;if(admin)selected=null;render()}).setAttribute('aria-current',String(page===id))}
 $('crumb').textContent=admin?'Server 控制台 / 客户端管理':'TraceMason Mini / 本机';
 $('title').textContent=admin?(selected?.name||'客户端管理'):entries.find(([id])=>id===page)[1];
 $('adminTab').setAttribute('aria-current',String(admin));$('miniTab').setAttribute('aria-current',String(!admin));
 if(admin)manage();else if(page==='binding')binding();else config(page);
}
$('adminTab').onclick=()=>{side='admin';page='clients';render()};
$('miniTab').onclick=()=>{side='mini';page='binding';render()};render();

$('scenario').onclick=()=>{
 const f=show('原型评审场景');
 for(const name of Object.keys(names)){
  const box=add(f,'section');add(box,'h3',names[name]);
  const installed=field(box,'已安装');installed.type='checkbox';installed.checked=inventory[name].installed;
  installed.onchange=()=>{inventory[name].installed=installed.checked;if(local)local.tools[name].installed=installed.checked;render()};
  if(local?.bound){
   const activity=add(add(box,'label','会话状态'),'select');for(const v of ['空闲已确认','活跃','未知'])activity.add(new Option(v,v));activity.value=local.tools[name].activity;
   activity.onchange=()=>{local.tools[name].activity=activity.value;sync(local);render()};
   const result=add(add(box,'label','验证响应样例'),'select');for(const v of ['成功','上游失败','拦截','未关联'])result.add(new Option(v,v));result.value=demoOutcomes[name];result.onchange=()=>{demoOutcomes[name]=result.value};
  }
 }
 if(local?.bound)btn(f,'进入本次续领窗口',()=>{hour=Math.max(hour,local.current.end-24);clients.forEach(sync);finish('已推进示例时间')});
};

$('modules').onclick=()=>{
 const content=show('其他模块 · 已有交互原型');
 const modules=[
  ['Server · API 账号与基础运维','账号配置、启停和连接检查','../v0.1.1/prototype/index.html'],
  ['Server · 隐私外发防护','防护工作台、外发记录和防护边界','../v0.1.2/prototype/index.html'],
  ['Mini · 本机工作区','CLI 安装与线路管理、会话、技能库、调试及界面语言','../../../TraceMason-App/design/v0.1.3-r9/client-demo.html']
 ];
 for(const [title,features,url] of modules){
  const row=add(content,'section');
  const link=add(row,'a',title+' ↗');
  link.href=url;link.target='_blank';link.rel='noopener';
  add(row,'p',features);
 }
 add(content,'small','各原型使用独立示例数据。R4 的设备绑定和临时凭据不会传入旧版原型。');
};
