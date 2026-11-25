const $=id=>document.getElementById(id);
const list=[device('开发工作站',['openai-dev','claude-team','gemini-lab']),device('评审电脑',['openai-review'])];
let active=0,screen='server',confirmAction;
const d=()=>list[active];
const element=(parent,tag,text='')=>{const e=document.createElement(tag);e.textContent=text;parent.append(e);return e};
function run(fn){try{fn();render()}catch(e){$('status').textContent=e.message}}
function button(parent,label,fn,disabled=false){const b=element(parent,'button',label);b.disabled=disabled;b.onclick=()=>run(fn);return b}
function input(parent,label,value=''){const l=element(parent,'label',label+' '),i=element(l,'input');i.value=value;return i}
function select(parent,label,items,value){const e=element(element(parent,'label',label+' '),'select');for(const [v,n] of items)e.add(new Option(n,v));e.value=value;return e}
function section(title){const s=element($('view'),'section');element(s,'h2',title);return s}
function message(s){$('status').textContent=s}
function management(){
 const c=d(),s=section('身份与账号授权'),name=input(s,'客户端名称',c.name);
 element(s,'code',c.id);const boxes=[];
 for(const [id,[tool,label]] of Object.entries(accounts)){
  const x=input(s,tool+' · '+label+' / '+id);x.type='checkbox';x.checked=c.grants.includes(id);boxes.push([id,x]);
 }
 button(s,'保存授权',()=>{if(!name.value.trim())throw Error('请输入名称');c.name=name.value.trim();c.grants=boxes.filter(([,x])=>x.checked).map(([id])=>id);sync(c);message('已保存')},c.revoked);
 button(s,'新建客户端',()=>{list.push(device('新客户端',[]));active=list.length-1;message('已创建，可编辑名称并分配账号')});
 const binding=section('设备绑定');
 element(binding,'p',c.revoked?'身份已撤销':c.bound?'设备已绑定':hour>=c.codeEnd?'激活码已到期':'一次性激活码 '+c.code);
 button(binding,c.bound?'更换绑定设备':'重新签发激活码',()=>{unbind(c);message('旧绑定已失效，客户端 ID 和授权保留')},c.revoked);
 button(binding,'撤销客户端身份',()=>{unbind(c,true);message('身份已撤销')},c.revoked);
}
function toolCard(parent,name,c){
 const t=c.tools[name],card=element(parent,'article');element(card,'h3',name);
 const state=t.route?(c.grants.includes(t.route)?t.route:'授权已撤回 · '+t.route):'尚未纳管';
 element(card,'p',[t.installed?'已安装':'未安装',t.config,t.activity,state,t.written?'配置第 '+t.written+' 代':'等待配置'].join('　·　'));
 element(card,'p',t.result);
 if(c.online&&t.route&&t.written){const status=authorize(t.token,t.route);if(status!==200)element(card,'p','此配置当前请求将被拒绝 · '+status)}
 const ids=c.grants.filter(id=>accounts[id][0]===name);
 if(ids.length){
  const route=select(card,'账号',ids.map(id=>[id,accounts[id][1]+' / '+id]),ids.includes(t.route)?t.route:ids[0]);
  const model=input(card,'模型',route.value===t.route?t.model:accounts[route.value][2]);route.onchange=()=>{model.value=accounts[route.value][2]};
  const b=element(card,'button','预览配置');
  b.disabled=!!c.receipt||!writable(t)||!c.online||hour>=c.sessionEnd;
  b.onclick=()=>{
   const id=route.value,m=model.value,target=c.next||c.current;
   $('changes').textContent=[files[name],'账号　'+(t.route||'本机配置')+' → '+id,'地址　'+(t.route?endpoint(c,name,t.route):'现有本地地址')+' → '+endpoint(c,name,id),'模型　'+(t.model||'当前值')+' → '+m,'凭据　已隐藏 → 第 '+target.n+' 代'].join('\n');
   confirmAction=()=>{if((c.next||c.current)?.n!==target.n)throw Error('目标代已变化，请重新预览');apply(c,name,id,m)};$('preview').showModal();
  };
 }
 if(t.route){
  const outcome=select(card,'模拟请求结果',['成功','上游失败','拦截','未关联'].map(v=>[v,v]),'成功');
  button(card,'按当前配置验证',()=>verify(c,name,outcome.value),!writable(t)||!c.online);
  button(card,'解除纳管',()=>{Object.assign(t,{route:'',written:0,verified:0,model:'',result:'已停止管理，本机配置保留'});sync(c)},!c.online||!!c.receipt);
 }
 const details=element(card,'details');element(details,'summary','模拟本机检测');
 for(const [label,field,values] of [['安装','installed',['已安装','未安装']],['配置','config',['可读','无效','外部修改']],['会话','activity',['空闲已确认','活跃','未知']]]){
  const control=select(details,label,values.map(v=>[v,v]),field==='installed'?(t.installed?'已安装':'未安装'):t[field]);
  control.disabled=!c.online;control.onchange=()=>run(()=>{t[field]=field==='installed'?control.value==='已安装':control.value;sync(c)});
 }
}
function endpoint(c,name,id){return c.address+'/proxy/'+id+(name==='Codex'?'/v1':'')}
function client(){
 const server=d(),c=miniView(server);
 if(!server.online)element($('view'),'p','离线 · 以下为上次连接时的记录，授权变更将在重连后同步。');
 if(!c.bound){
  const s=section(c.revoked?'身份已撤销':'绑定到 Server');
  if(!c.revoked){
   const addr=input(s,'服务地址','http://192.168.1.10:8769'),code=input(s,'一次性激活码');
   button(s,'绑定并领取首代凭据',()=>{activate(c,addr.value,code.value.trim());message('绑定成功')},!c.online);
  }
 }else{
  const s=section('设备连接');element(s,'p',c.address+'　·　'+(c.online?'在线':'离线')+'　·　'+(hour<c.sessionEnd?'设备会话有效':'会话已过期，请重新绑定'));
  const {current:k,next}=knownGenerations(c);element(s,'p',((c.online&&!c.receipt)?'服务端当前第 ':'上次同步第 ')+k.n+' 代 · '+(hour>=k.end?'已到期':'剩余 '+(k.end-hour)+' 小时')+(next?'　/　第 '+next.n+' 代待确认':'')+(c.receipt?'　/　Mini 等待核对确认回执':''));
  const lines=section('本机 CLI');Object.keys(files).forEach(name=>toolCard(lines,name,c));
 }
 const sim=section('评审场景');button(sim,c.online?'模拟断网':'恢复联网',()=>{connectivity(server,!server.online)});
 for(const delta of [24,144,168])button(sim,'推进 '+delta+' 小时',()=>{hour+=delta;list.forEach(sync)});
 button(sim,'模拟下次确认回包丢失',()=>{c.drop=true;message('将在下一次确认时丢弃回包')},!c.online||!c.bound||c.drop);
 button(sim,'重新同步',()=>{sync(c);message(c.online?'同步已完成':'设备离线')},!c.online||!c.bound);
}
function render(){
 $('devices').replaceChildren(...list.map((c,i)=>new Option(screen==='mini'?miniView(c).name:c.name,String(i))));$('devices').value=String(active);
 $('clock').textContent='T + '+hour+' h';$('title').textContent=screen==='server'?'客户端管理':'设备与服务器';
 for(const id of ['server','mini'])$(id).setAttribute('aria-pressed',String(screen===id));
 $('view').replaceChildren();if(screen==='server')management();else client();
}
$('devices').onchange=()=>{active=Number($('devices').value);message('');render()};
for(const id of ['server','mini'])$(id).onclick=()=>{screen=id;message('');render()};
$('cancel').onclick=()=>$('preview').close();
$('confirm').onclick=()=>{$('preview').close();run(confirmAction)};render();
