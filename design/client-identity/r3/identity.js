// All state belongs to this local demonstration. No network requests are made.
const accounts = {
  'openai-dev': ['Codex', '开发账号', 'gpt-6.2-sol'],
  'openai-review': ['Codex', '评审账号', 'gpt-6.2-astra'],
  'claude-team': ['Claude', '团队账号', 'claude-sonnet-5-5'],
  'gemini-lab': ['Gemini', '实验账号', 'gemini-4-argon']
};
const files = {Codex:'config.toml · auth.json', Claude:'settings.json', Gemini:'.env · settings.json'};
let hour = 0;
function demoId(){return Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join('')}
function newTool() {
  return {installed:true, config:'可读', activity:'空闲已确认', route:'', model:'', written:0, verified:0, result:'尚未验证'};
}
function device(name, grants) {
  return {id:demoId(), name, grants, code:demoId(), codeEnd:hour+1,
    epoch:1, serial:0, current:null, next:null, online:true, drop:false, receipt:false,
    bound:false, revoked:false, address:'', sessionEnd:0, tools:Object.fromEntries(Object.keys(files).map(k=>[k,newTool()]))};
}
const issued = new Map();
function key(d) {
  const generation = {n:++d.serial, end:hour+168, token:demoId()};
  issued.set(generation.token,{owner:d, epoch:d.epoch, generation});
  return generation;
}
function connectivity(d,online){
  if(!online && d.online){
    const {offlineView,...state}=d;
    d.offlineView=structuredClone({...state,online:false});
  }
  d.online=online;
  if(online){delete d.offlineView;sync(d)}
}
function miniView(d){return d.online?d:d.offlineView}

function knownGenerations(d){
  return d.receipt || {current:d.current,next:d.next};
}
function activate(d,address,code) {
  const url=new URL(address);
  if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.search||url.hash)throw Error('请输入 HTTP 或 HTTPS 服务地址');
  if(!d.online||d.revoked||!d.code||code!==d.code||hour>=d.codeEnd)throw Error('无法绑定，请检查连接和激活码');
  d.address=url.href.replace(/\/$/,''); d.bound=true; d.code=''; d.sessionEnd=hour+720; d.current=key(d);
}
function unbind(d,revoke=false) {
  d.epoch++; d.code=revoke?'':demoId(); d.codeEnd=hour+1; d.revoked=revoke;
  d.bound=false; d.current=null; d.next=null; d.receipt=false; d.drop=false;
  d.tools=Object.fromEntries(Object.keys(files).map(k=>[k,newTool()]));
}
function authorize(token,route) {
  const record=issued.get(token);
  if(!record)return 401;
  const {owner,epoch,generation}=record;
  if(owner.revoked||!owner.bound||owner.epoch!==epoch||hour>=generation.end||
     (owner.current!==generation&&owner.next!==generation))return 401;
  return owner.grants.includes(route)?200:403;
}
function writable(t){return t.installed&&t.config==='可读'&&t.activity==='空闲已确认'}
function sync(d) {
  if(!d.bound||!d.online||d.revoked||hour>=d.sessionEnd)return;
  if(d.receipt){d.receipt=false;} // GET /device/me reconciles a lost acknowledgement.
  if(d.next&&hour>=d.next.end)d.next=null;
  if(!d.next&&d.current.end-hour<=24)d.next=key(d);
  if(!d.next)return;
  const enrolled=Object.values(d.tools).filter(t=>d.grants.includes(t.route));
  for(const t of enrolled){
    if(writable(t)&&t.written!==d.next.n){
      t.token=d.next.token;t.written=d.next.n;t.verified=0;t.result='配置已回读，等待正常启动验证';
    }
  }
  if(enrolled.every(t=>t.verified===d.next.n)){
    if(d.drop){
      d.receipt={current:d.current,next:d.next};
      d.drop=false;
    }
    d.current=d.next;d.next=null;
  }
}
function apply(d,tool,route,model) {
  const t=d.tools[tool], generation=d.next||d.current;
  if(!d.online||!generation||hour>=d.sessionEnd||!writable(t)||accounts[route]?.[0]!==tool||
      authorize(generation.token,route)!==200||!model.trim())throw Error('配置或授权已变化，请重新预览');
  Object.assign(t,{route,model:model.trim(),written:generation.n,token:generation.token,verified:0,result:'配置已回读，等待正常启动验证'});
  sync(d);
}
function verify(d,tool,outcome) {
  const t=d.tools[tool];
  if(!d.online||!writable(t)||!t.route)throw Error('当前无法启动验证');
  const status=authorize(t.token,t.route);
  t.result='网关 '+status;
  if(status===200){
    if(outcome==='未关联'){t.result+=' · 待核实';}
    else {
      t.verified=t.written;
      t.result+=' · '+({成功:'隐私放行 · 生成成功',上游失败:'隐私放行 · 上游失败',拦截:'隐私拦截 · 未发往上游'})[outcome];
    }
  }
  sync(d);
}
