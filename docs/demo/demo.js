/* TraceMason v0.1 interactive prototype.
 * All fixtures and evaluation outcomes are synthetic.
 * No network requests, real model inference, or persistent changes occur.
 */
(function () {
  "use strict";

  var icons = {
    grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    scan:'<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><circle cx="12" cy="12" r="4"/><path d="m10.5 12 1 1 2-2"/>',
    chart:'<path d="M4 19V5M4 19h16M8 15l4-5 3 2 5-7"/>',
    brain:'<path d="M12 8a4 4 0 0 0-7 3 4 4 0 0 0 0 7 3 3 0 0 0 5 2c1-1 2-2 2-5V8Zm0 0a4 4 0 0 1 7 3 4 4 0 0 1 0 7 3 3 0 0 1-5 2c-1-1-2-2-2-5"/><path d="M8 12c1 0 2 1 2 2m4-1c1-1 2-1 3-1"/>',
    layers:'<path d="m12 2 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
    shield:'<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/>',
    plug:'<path d="M7 3v5M17 3v5M5 8h14v4a7 7 0 0 1-14 0V8Zm7 11v3"/>',
    book:'<path d="M4 19V5a2 2 0 0 1 2-2h14v17H6a2 2 0 0 1-2-2Zm0 0a2 2 0 0 1 2-2h14"/>',
    menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
    info:'<circle cx="12" cy="12" r="10"/><path d="M12 11v6M12 7h.01"/>',
    rotate:'<path d="M3 12a9 9 0 1 0 3-7M3 3v6h6"/>',
    arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
    check:'<path d="m4 12 5 5L20 6"/>',
    x:'<path d="M18 6 6 18M6 6l12 12"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    spark:'<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2Z"/>',
    activity:'<path d="M3 12h4l3-8 4 16 3-8h4"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    file:'<path d="M7 2h7l5 5v15H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm7 0v6h5M9 13h6M9 17h6"/>',
    upload:'<path d="M12 16V3m-5 5 5-5 5 5M4 17v3h16v-3"/>',
    git:'<circle cx="6" cy="4" r="2"/><circle cx="6" cy="20" r="2"/><circle cx="18" cy="6" r="2"/><path d="M6 6v12M6 11c0-3 3-5 10-5"/>',
    alert:'<path d="m12 3 10 18H2L12 3Z"/><path d="M12 9v5M12 18h.01"/>',
    terminal:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3 3-3 3m6 0h4"/>',
    copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>'
  };
  function icon(name) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" aria-hidden="true">' + (icons[name] || icons.info) + '</svg>'; }
  function esc(x) { return String(x == null ? "" : x).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];}); }
  function badge(label,tone) { return '<span class="badge badge-' + (tone||"slate") + '">' + esc(label) + '</span>'; }
  function btn(label,action,extra,kind) { return '<button class="button ' + (kind||"") + '" data-action="' + action + '"' + (extra||"") + '>' + label + '</button>'; }
  function pageHead(kicker,title,desc,actions) { return '<div class="page-head"><div><div class="eyebrow">' + kicker + '</div><h1>' + title + '</h1><p>' + desc + '</p></div><div class="page-actions">' + (actions||"") + '</div></div>'; }
  function cardTitle(title,more) { return '<div class="card-hd"><h2>' + title + '</h2>' + (more||"") + '</div>'; }
  function viewButton(page,label,kind) { return '<button class="button ' + (kind||"") + '" data-page="' + page + '">' + label + '</button>'; }

  var traces = [
    {id:"evt-101",time:"09:41:14",title:"修复 API 测试失败",task:"TM-104",actor:"Codex",model:"GPT-6 Sol",risk:"warning",policy:"Allow",cost:"$0.42",latency:"8.4s",result:"Claim ≠ verified",request:"修复 auth API 的失败测试，并确认相关单元测试通过。",response:"模型回复：已修复所有测试，可以合并。",evidence:"CI pytest: 3 failed, 41 passed。模型未提供可验证的测试结果。",source:"Gateway + CI",decision:"只记录；标记虚假完成声明。"},
    {id:"evt-102",time:"09:47:02",title:"同一任务修正与复验",task:"TM-104",actor:"Codex",model:"GPT-6 Astra",risk:"ok",policy:"Allow",cost:"$0.86",latency:"12.1s",result:"Verified by CI",request:"根据真实失败日志修正 API 测试，并附验证结果。",response:"模型回复：已修改异常路径，附测试结果和变更文件列表。",evidence:"CI pytest: 44 passed；Diff 检查已记录；审阅通过。",source:"Gateway + Hook + CI",decision:"与外部 CI 结果关联，任务验证通过。"},
    {id:"evt-103",time:"10:05:19",title:"敏感凭据外发检测",task:"TM-107",actor:"Internal App",model:"GPT-6",risk:"blocked",policy:"Block",cost:"$0.00",latency:"0.1s",result:"Prevented",request:"请分析配置：api_key=[REDACTED]（原内容不在本演示中保存）。",response:"请求在演示策略中被拦截；未发送给模型。",evidence:"Policy SEC-01 / synthetic credential pattern matched before sending。",source:"Gateway Policy",decision:"Block and redact; no upstream request."},
    {id:"evt-104",time:"10:17:44",title:"解释 Helm Chart 升级路径",task:"TM-106",actor:"OpenCode",model:"Claude",risk:"ok",policy:"Allow",cost:"$0.23",latency:"6.2s",result:"Unknown",request:"列出 Chart 升级的潜在兼容性风险。",response:"模型生成了风险列表，但未执行集群验证。",evidence:"仅有 Gateway 响应，缺少执行 Hook 和验收证据。",source:"Gateway only",decision:"Execution coverage incomplete; outcome unknown."},
    {id:"evt-105",time:"11:03:22",title:"验证配置重构结果",task:"TM-105",actor:"Claude Code",model:"Claude",risk:"ok",policy:"Allow",cost:"$0.38",latency:"9.8s",result:"Verified by tests",request:"重构配置加载模块并运行预定义测试。",response:"模型报告改动及验证步骤。",evidence:"Unit tests: 18 passed；Git Diff/CI 均有对应记录。",source:"Gateway + Hook + CI",decision:"通过独立证据标记已验证。"},
    {id:"evt-106",time:"11:22:09",title:"生成组件变更建议",task:"TM-106",actor:"OpenCode",model:"GPT-6 Sol",risk:"warning",policy:"Allow",cost:"$0.16",latency:"5.0s",result:"Unknown",request:"提供可选的组件性能优化建议。",response:"模型生成了配置建议，未执行性能基准测试。",evidence:"没有独立性能测试，也没有用户验收。",source:"Gateway only",decision:"记录缺少验证；不声明优化成功。"}
  ];

  var stages = ["candidate","draft","tested","approved","canary","active"];
  var stageLabels = {candidate:"Candidate",draft:"Draft",tested:"Tested",approved:"Approved",canary:"Canary",active:"Active",rolled_back:"Rolled back",rejected:"Rejected"};
  var stageTones = {candidate:"amber",draft:"blue",tested:"blue",approved:"green",canary:"amber",active:"green",rolled_back:"slate",rejected:"red"};
  var state = {page:"overview",selected:"evt-101",auditSearch:"",auditRisk:"all",stage:"candidate",policyResult:null};
  var pageNames = {overview:"Overview",audit:"Audit",quality:"Quality",experience:"Experience",skills:"Skill Registry",policies:"Policies",integrations:"Integrations"};
  var el = document.getElementById("view");
  var nav = document.getElementById("main-nav");
  var toastTimer;

  function stepProgress(){
    if(state.stage==="candidate"||state.stage==="rejected")return 0;
    if(state.stage==="draft")return 1;
    if(state.stage==="tested")return 2;
    if(state.stage==="approved")return 3;
    return 4;
  }
  function stageIndex(){return stages.indexOf(state.stage);}
  function stageAtLeast(s){return stageIndex()>=stages.indexOf(s);}
  function updateChrome(){
    document.getElementById("page-breadcrumb").textContent=pageNames[state.page];
    document.querySelectorAll(".nav-item").forEach(function(button){
      var selected=button.getAttribute("data-page")===state.page;
      button.classList.toggle("is-active",selected);
      if(selected)button.setAttribute("aria-current","page");else button.removeAttribute("aria-current");
    });
    var step=stepProgress();
    document.getElementById("sidebar-progress").textContent=step+" / 4";
    document.getElementById("sidebar-progress-bar").style.width=(step*25)+"%";
    document.getElementById("audit-count").textContent=traces.filter(function(t){return t.risk!=="ok";}).length;
  }
  function render(){
    updateChrome();
    var pages={overview:renderOverview,audit:renderAudit,quality:renderQuality,experience:renderExperience,skills:renderSkills,policies:renderPolicies,integrations:renderIntegrations};
    el.innerHTML=pages[state.page]();
  }
  function navigate(page){
    if(!pageNames[page])return;
    state.page=page;
    document.getElementById("sidebar").classList.remove("is-open");
    document.getElementById("menu-toggle").setAttribute("aria-expanded","false");
    render();
    window.scrollTo({top:0,behavior:"instant"});
    el.focus({preventScroll:true});
  }
  function toast(message){
    var node=document.getElementById("toast");
    node.textContent=message;node.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer=window.setTimeout(function(){node.classList.remove("show");},3300);
  }
  function flowAction(){
    if(state.stage==="candidate")return navigate("audit");
    if(state.stage==="draft"||state.stage==="tested"||state.stage==="approved"||state.stage==="canary")return navigate("skills");
    if(state.stage==="active")return navigate("quality");
    navigate("experience");
  }

  function renderOverview(){
    var active=state.stage==="active" ? 2:1;
    var flow=[
      ["OBSERVE","Gateway traces","事件已接入"],["VERIFY","Task evidence","CI / Hook"],
      ["LEARN","Candidate instinct",state.stage==="candidate"?"待审查":stateLabels[state.stage]],
      ["TEST","Skill evaluation",stageAtLeast("tested")?"已模拟验证":"待运行"],
      ["PUBLISH","Canary & rollback",stageAtLeast("canary")?"已模拟发布":"待发布"]
    ];
    var flowMarkup=flow.map(function(s,i){
      return '<div class="workflow-step '+(i<2 || (i===2&&state.stage!=="candidate") || (i===3&&stageAtLeast("tested")) || (i===4&&stageAtLeast("canary"))?"is-done":i===2 && state.stage==="candidate"?"is-current":"")+'"><div class="step-id">0'+(i+1)+' / '+s[0]+'</div><strong>'+s[1]+'</strong><small>'+esc(s[2])+'</small></div>';
    }).join("");
    var activities=[
      ["shield","模拟请求包含凭据，输入策略拦截","SEC-01 · evt-103","10:05"],
      ["alert","Agent 宣告完成，但 CI 测试失败","TM-104 · evt-101","09:41"],
      ["check","修正后通过独立 CI 验收","TM-104 · evt-102","09:47"]
    ];
    if(state.stage!=="candidate")activities.unshift(["spark","经验审核进度已更新","Skill v0.2.0 · "+stageLabels[state.stage],"刚刚"]);
    return '<section class="hero"><div class="hero-content"><div class="hero-kicker">EVIDENCE-DRIVEN AGENT IMPROVEMENT · INTERACTIVE PROTOTYPE</div><h1>把 AI 交互记录，<br>转化为<span>可信工作能力。</span></h1><p>从模型请求、失败测试和用户纠正中提炼可验证经验，再通过治理流程演化为可复用的 Skills。</p><div class="row">'+viewButton("audit","探索审计事件 "+icon("arrow"),"button-primary")+viewButton("experience","查看经验候选","button-dark")+'</div></div><div class="hero-visual"><div class="diagram"><div class="diagram-node"><span class="diagram-ico">'+icon("activity")+'</span><span><strong>Model & Agent Events</strong><small>Source evidence · Gateway / CI</small></span><span class="diagram-label">LIVE?</span></div><div class="diagram-node"><span class="diagram-ico">'+icon("shield")+'</span><span><strong>Verified Task Outcomes</strong><small>Independent checks only</small></span></div><div class="diagram-node"><span class="diagram-ico">'+icon("layers")+'</span><span><strong>Governed Skills</strong><small>Evaluated · Approved · Scoped</small></span><span class="diagram-label">v0.2</span></div></div></div></section>'+
      '<div class="kpi-grid">'+
        kpi("Inference events","06","审计窗口内",icon("activity"))+
        kpi("Policy findings","02","1 blocked · 1 warning",icon("shield"))+
        kpi("Verified tasks","2 / 3","还有 1 项 unknown",icon("check"))+
        kpi("Active Skills","0"+active,state.stage==="active"?"包含已发布的候选版本":"1 existing stable version",icon("layers"))+
      '</div>'+
      '<div class="section-title"><h2>Experience to Skill · 工作闭环</h2><button data-action="guide" class="button button-sm">继续演示 '+icon("arrow")+'</button></div>'+
      '<div class="card card-padding"><div class="workflow-steps">'+flowMarkup+'</div><div style="margin-top:17px" class="callout"><strong>演示目标：</strong> 将“模型宣称完成，但测试失败”的事件转成 verified-code-delivery Skill，并模拟评估、审批、灰度和回滚。<button class="button button-sm button-link" data-page="experience">查看候选 →</button></div></div>'+
      '<div class="section-title"><h2>Recent activity</h2><span class="subtle">Synthetic fixture · 2026-11-05</span></div>'+
      '<div class="split-grid"><div class="card card-padding">'+cardTitle("审计与执行事件",'<button class="button button-sm" data-page="audit">查看全部</button>')+'<div class="activity-list">'+activities.map(function(a){return '<div class="activity-item"><span class="activity-ico" style="background:#eff8f7;color:#148b78">'+icon(a[0])+'</span><div class="activity-text"><strong>'+esc(a[1])+'</strong><p>'+esc(a[2])+'</p></div><time>'+a[3]+'</time></div>';}).join("")+'</div></div><div class="card card-padding">'+cardTitle("什么才算交付成功？")+ '<div class="evidence-list"><div class="evidence-row"><span class="evidence-indicator fail"></span><div><strong>Model claim</strong><p>模型说“已完成”只是声明，不是事实验证。</p></div></div><div class="evidence-row"><span class="evidence-indicator"></span><div><strong>External verification</strong><p>CI、测试、Git Diff 与人工验收提供独立证据。</p></div></div><div class="evidence-row"><span class="evidence-indicator unknown"></span><div><strong>Unknown stays unknown</strong><p>没有 Agent Hook 的任务必须标记为覆盖不足。</p></div></div></div></div></div>';
  }

  function kpi(title,num,sub,svg){
    return '<div class="card kpi"><div class="kpi-head"><span>'+title+'</span><span class="kpi-icon">'+svg+'</span></div><div class="kpi-number">'+num+'</div><div class="kpi-bottom">'+esc(sub)+'</div></div>';
  }

  function filteredTraces(){
    return traces.filter(function(t){
      var q=state.auditSearch.trim().toLowerCase();
      var hit=!q || [t.id,t.title,t.task,t.actor,t.model].join(" ").toLowerCase().indexOf(q)>-1;
      return hit && (state.auditRisk==="all"||state.auditRisk===t.risk);
    });
  }
  function riskBadge(t){
    if(t.risk==="blocked")return badge("Blocked","red");
    if(t.risk==="warning")return badge("Review","amber");
    return badge("Allowed","green");
  }
  function auditRows(){
    var rows=filteredTraces();
    if(!rows.length)return '<tr><td colspan="7"><div class="empty"><strong>没有符合条件的事件</strong><p>尝试调整关键词或风险类型。</p></div></td></tr>';
    return rows.map(function(t){
      return '<tr class="clickable '+(state.selected===t.id?"is-selected":"")+'" data-trace="'+t.id+'" tabindex="0" role="button" aria-label="查看事件 '+esc(t.id)+'"><td><span class="mono">'+t.time+'</span><br><em>'+t.id+'</em></td><td><strong>'+esc(t.title)+'</strong><br><em>'+t.task+' · '+t.actor+'</em></td><td>'+esc(t.model)+'</td><td>'+riskBadge(t)+'</td><td>'+badge(t.result,t.result.indexOf("Verified")===0?"green":t.result==="Unknown"?"slate":t.result==="Prevented"?"red":"amber")+'</td><td><span class="mono">'+t.cost+'</span></td><td>'+icon("arrow")+'</td></tr>';
    }).join("");
  }
  function auditInspector(){
    var t=traces.find(function(x){return x.id===state.selected;}) || filteredTraces()[0];
    if(!t)return '<div class="card inspector card-padding"><div class="empty">选择审计事件</div></div>';
    return '<div class="card inspector"><div class="inspector-top"><div class="eyebrow">EVENT INSPECTOR</div><div class="row" style="justify-content:space-between"><h2>'+esc(t.id)+'</h2>'+riskBadge(t)+'</div><div class="subtle">'+esc(t.title)+'</div></div><div class="inspector-body"><div class="detail-pair"><span>Task / Actor</span><span>'+t.task+' · '+t.actor+'</span></div><div class="detail-pair"><span>Model</span><span>'+esc(t.model)+'</span></div><div class="detail-pair"><span>Decision</span><span>'+esc(t.policy)+'</span></div><div class="detail-pair"><span>Observed source</span><span>'+esc(t.source)+'</span></div><div class="detail-pair"><span>Cost / Latency</span><span>'+t.cost+' / '+t.latency+'</span></div><div class="detail-box"><h3>Redacted request</h3><p>'+esc(t.request)+'</p></div><div class="detail-box"><h3>Observed response</h3><p>'+esc(t.response)+'</p></div><div class="detail-box"><h3>Independent evidence</h3><p>'+esc(t.evidence)+'</p></div><div class="callout '+(t.risk==="blocked"?"warn":"")+'" style="margin-top:13px"><strong>Interpretation</strong><br>'+esc(t.decision)+'</div><div class="row" style="margin-top:15px">'+viewButton("quality","打开任务质量 "+icon("arrow"),"button-sm")+'</div></div></div>';
  }
  function renderAudit(){
    return pageHead("TRACE INSPECTION / P0","Audit & Evidence","检查模型调用、风险处理及独立执行证据。选择任一事件，可在右侧查看经过脱敏的详情。",btn("继续到 Quality","guide",'',"button-primary"))+
      '<div class="toolbar"><label class="search-field">'+icon("search")+'<input id="audit-search" type="search" value="'+esc(state.auditSearch)+'" placeholder="搜索事件、任务、模型或 Agent…" autocomplete="off" aria-label="搜索审计事件"></label><select id="risk-filter" class="form-control" aria-label="风险状态"><option value="all">全部状态</option><option value="warning" '+(state.auditRisk==="warning"?"selected":"")+'>需要复核</option><option value="blocked" '+(state.auditRisk==="blocked"?"selected":"")+'>已阻断</option><option value="ok" '+(state.auditRisk==="ok"?"selected":"")+'>正常</option></select><span class="subtle" id="audit-total">共 '+filteredTraces().length+' 条模拟事件</span></div>'+
      '<div class="two-columns"><div class="card"><div class="card-hd" style="padding:17px 18px 0"><h2>Inference timeline</h2>'+badge("Read-only fixture","blue")+'</div><div class="table-scroll"><table class="data-table"><thead><tr><th>Time / ID</th><th>Request / Task</th><th>Model</th><th>Policy</th><th>Outcome</th><th>Cost</th><th></th></tr></thead><tbody id="audit-rows">'+auditRows()+'</tbody></table></div></div><div id="audit-inspector">'+auditInspector()+'</div></div>'+
      '<div class="section-title"><h2>Evidence coverage</h2></div><div class="callout warn"><strong>边界提示：</strong> 这 6 条事件是人工编写的模拟数据，不是实际网关日志。仅有 Gateway 记录时，不能推断 Agent 的本地命令、测试或最终交付结果。</div>';
  }
  function updateAudit(){
    var rows=document.getElementById("audit-rows");
    if(!rows)return;
    var filtered=filteredTraces();
    if(!filtered.find(function(t){return t.id===state.selected;}) && filtered.length)state.selected=filtered[0].id;
    rows.innerHTML=auditRows();
    document.getElementById("audit-total").textContent="共 "+filtered.length+" 条模拟事件";
    document.getElementById("audit-inspector").innerHTML=auditInspector();
  }

  function renderQuality(){
    var evaluated=stageAtLeast("tested")||state.stage==="rolled_back";
    var compare=evaluated
      ? '<div class="compare-bars"><div class="compare-col"><strong>9 / 15</strong><div class="compare-bar" style="height:95px"></div><span>No Skill · 60%</span></div><div class="compare-col"><strong>12 / 15</strong><div class="compare-bar improved" style="height:127px"></div><span>Candidate · 80%</span></div></div><div class="footer-note">固定的示例评估结果，仅用于 UI 演示；未执行任何真实模型评测，不可用于证明效果。样本量 n=15，不代表统计显著性。</div>'
      : '<div class="empty">'+icon("chart")+'<strong>等待 Skill 评估</strong><p>需要先审核候选经验并在 Skill Registry 中触发模拟评估。</p><div style="margin-top:15px">'+viewButton("experience","审核经验候选","button-sm")+'</div></div>';
    return pageHead("OUTCOME INTELLIGENCE","Task Quality","将模型完成声明、工具执行记录和独立验收结果分开显示。没有足够证据的任务保留 Unknown 状态。",viewButton("audit","审计原始事件"))+
      '<div class="quality-grid"><div class="card quality-tile"><span>VERIFICATION COVERAGE</span><strong>2 / 3</strong><p>已通过外部 CI/Hook 验证的任务</p></div><div class="card quality-tile"><span>FALSE COMPLETION CLAIMS</span><strong>01</strong><p>一次“已完成”声明与 CI 结果冲突</p></div><div class="card quality-tile"><span>UNCERTAIN OUTCOMES</span><strong>01</strong><p>缺少 Agent 工具或验收证据</p></div></div>'+
      '<div class="section-title"><h2>Task outcomes</h2><span class="subtle">Task-based, not message-based</span></div>'+
      '<div class="card"><div class="task-list">'+
      taskRow("TM-104","API 测试修复","Codex · 2 model requests · pytest 失败后修正","Verified","green","evt-101")+
      taskRow("TM-105","配置模块重构","Claude Code · Unit tests: 18 passed","Verified","green","evt-105")+
      taskRow("TM-106","Helm 升级分析","OpenCode · 缺少 Agent Hook 和最终业务验收","Unknown","slate","evt-104")+
      '</div></div>'+
      '<div class="section-title"><h2>Skill impact / 对照结果</h2>'+badge(evaluated?"Simulated result":"Awaiting evaluation",evaluated?"blue":"slate")+'</div>'+
      '<div class="split-grid"><div class="card card-padding">'+cardTitle("Fixed evaluation suite",'<span class="subtle">15 synthetic cases</span>')+compare+'</div><div class="card card-padding">'+cardTitle("Evidence rules")+'<div class="evidence-list"><div class="evidence-row"><span class="evidence-indicator fail"></span><div><strong>Agent claims</strong><p>不能作为独立成功证据。</p></div></div><div class="evidence-row"><span class="evidence-indicator"></span><div><strong>CI / test / human acceptance</strong><p>只有与验收准则匹配的外部结果可以支持 Verified。</p></div></div><div class="evidence-row"><span class="evidence-indicator unknown"></span><div><strong>Missing evidence</strong><p>标记 Unknown，不能自动记为成功或失败。</p></div></div></div></div></div>';
  }
  function taskRow(id,title,desc,status,tone,trace){
    return '<div class="task-row"><div class="task-icon">'+icon("terminal")+'</div><div class="task-desc"><strong>'+id+' · '+title+'</strong><small>'+desc+'</small></div>'+badge(status,tone)+'<button class="button button-sm" data-inspect="'+trace+'">证据详情 '+icon("arrow")+'</button></div>';
  }

  function renderExperience(){
    var isCandidate=state.stage==="candidate";
    var rejected=state.stage==="rejected";
    var actions=isCandidate
      ? '<div class="skill-actions">'+btn(icon("check")+" 批准为 Skill 草稿","approveExperience",'',"button-primary")+btn("拒绝候选","rejectExperience",'',"button-danger")+'</div>'
      : rejected ? '<div class="callout warn"><strong>候选已拒绝。</strong> 当前演示中不会进一步生成 Skill。你可以重置流程重新演示。</div>'+btn("重置演示","reset",'',"button-sm")
      : '<div class="callout"><strong>候选已通过模拟审核。</strong> 已创建可编辑的 Skill v0.2.0 草稿，并保留来源事件和审查记录。</div><div style="margin-top:14px">'+viewButton("skills","进入 Skill Registry "+icon("arrow"),"button-primary")+'</div>';
    var li=[["失败观察","evt-101 · 模型称任务完成，但 pytest 3 failed","fail"],["纠错与修复","evt-102 · 真实测试完成后再次提交","pass"],["独立验收","CI 44 passed + Diff review · Synthetic fixture","pass"],["反例/适用范围","仅适用于需要代码交付验证的任务，不能替代安全审批","unknown"]];
    return pageHead("EXPERIENCE MINING","Experience Review","从重复错误、人工反馈与执行证据中识别候选规则。审核的是经验假设，不是 AI 对自身输出的认可。",viewButton("audit","查看来源审计"))+
      '<div class="experience-layout"><div class="card candidate"><div class="row">'+badge("INS-001","blue")+badge(rejected?"Rejected":isCandidate?"Needs review":"Reviewed",isCandidate?"amber":rejected?"red":"green")+'</div><h2>Verified Code Delivery</h2><p>当 Agent 声称完成代码修改时，必须区分生成结果与已完成外部验证，避免因“模型自报成功”提前关闭任务。</p><div class="metrics-line"><div><strong>03</strong><span>支持事件</span></div><div><strong>01</strong><span>反例 / 边界</span></div><div><strong>Project</strong><span>建议作用范围</span></div></div><div class="eyebrow">PROPOSED INSTINCT</div><div class="rule-quote">对需要代码交付验收的任务，在报告完成前检查实际变更、执行必要的测试和静态检查，并明确列出未执行的验证。不能虚构测试结果。</div><div class="callout warn" style="margin-bottom:19px"><strong>证据分级：</strong> 用户纠正是失败信号；最终通过真实 CI 的事件才能支持针对特定验收条件的已验证结论。</div>'+actions+'</div>'+
      '<div class="card stage-box">'+cardTitle("Source evidence",badge("Traceable","green"))+'<div class="evidence-list">'+li.map(function(e){return '<div class="evidence-row"><span class="evidence-indicator '+(e[2]==="fail"?"fail":e[2]==="unknown"?"unknown":"")+'"></span><div><strong>'+e[0]+'</strong><p>'+esc(e[1])+'</p></div></div>';}).join("")+'</div><div style="margin-top:17px">'+btn("从审计查看失败请求","inspectFailure",'',"button-sm")+'</div></div></div>';
  }

  var skillText = [
    "---",
    "name: verified-code-delivery",
    "description: Verify code changes before claiming completion.",
    "---",
    "",
    "# Verified Code Delivery",
    "",
    "## Trigger",
    "Use when a coding or refactoring task requires acceptance.",
    "",
    "## Procedure",
    "1. Inspect the actual changed files.",
    "2. Match changes to task acceptance criteria.",
    "3. Run relevant tests and static checks.",
    "4. Report all failed or unavailable checks.",
    "5. Claim completion only with required evidence.",
    "",
    "## Constraints",
    "- Never invent test results.",
    "- Do not bypass security approvals.",
    "- Clearly label missing external verification.",
    "",
    "## Evidence",
    "Link CI results, Git diff and acceptance status."
  ].join("\n");

  function skillActionButtons(){
    var s=state.stage;
    if(s==="candidate")return viewButton("experience","先审核 Experience "+icon("arrow"),"button-primary");
    if(s==="draft")return btn(icon("chart")+" 运行模拟评估","evaluate",'',"button-primary");
    if(s==="tested")return btn(icon("check")+" 审批此版本","approveSkill",'',"button-primary");
    if(s==="approved")return btn(icon("upload")+" 发布到 Canary","canary",'',"button-primary");
    if(s==="canary")return btn(icon("arrow")+" 推广至 Active","promote",'',"button-primary")+btn("回滚到 v0.1.0","rollback",'',"button-danger");
    if(s==="active")return btn(icon("rotate")+" 回滚到 v0.1.0","rollback",'',"button-danger");
    if(s==="rolled_back")return btn("重置并重新体验","reset",'',"button-primary");
    return btn("重置演示","reset",'',"button-primary");
  }
  function skillTimeline(){
    var labels=[["Experience reviewed","产生经过审核的候选规则","draft"],["Evaluation passed","15 个预设用例的模拟对照","tested"],["Version approved","模拟授权人员批准","approved"],["Canary distributed","只在演示范围分发","canary"],["Release active","模拟目标运行时切换","active"]];
    return '<div class="timeline">'+labels.map(function(step){
      var done=stageAtLeast(step[2]);
      return '<div class="timeline-entry"><span class="timeline-bullet">'+(done?"✓":"·")+'</span><div><strong style="color:'+(done?"#137e6d":"#657989")+'">'+step[0]+'</strong><p>'+step[1]+'</p></div></div>';
    }).join("")+'</div>';
  }
  function renderSkills(){
    var current=state.stage;
    var details=current==="candidate"?"仍为经验候选；审核之前不能运行评估或发布。":
      current==="draft"?"草稿已创建。接下来需要运行可重复的评估用例。":
      current==="tested"?"模拟评估已通过。真实系统应使用独立结果、回归阈值和人工复核。":
      current==="approved"?"版本已审批，但尚未发布；批准与部署是两个不同的动作。":
      current==="canary"?"此版本已模拟发布到 1/3 个目标 Agent。可以推广或回滚。":
      current==="active"?"候选版本已模拟激活。点击回滚可恢复原稳定版本。":
      current==="rolled_back"?"已模拟回滚到 v0.1.0，v0.2.0 不再分发。":"候选经验被拒绝。";
    return pageHead("GOVERNED CAPABILITIES","Skill Registry","Skill 不只是 SKILL.md 文件，还包括来源证据、评估、审批、作用域、版本和回滚。整个过程为本地模拟。",btn(icon("copy")+" 复制 SKILL.md","copySkill",'',"button"))+
      '<div class="card card-padding" style="margin-bottom:15px"><div class="row" style="justify-content:space-between;flex-wrap:wrap"><div><span class="eyebrow">SKILL VERSION · v0.2.0</span><h2 style="font-size:19px;margin:5px 0">verified-code-delivery</h2><p class="muted small" style="margin:0">来源：INS-001 · evidence refs: evt-101, evt-102 · scope: demo/project</p></div>'+badge(stageLabels[current],stageTones[current])+'</div><div class="callout" style="margin:18px 0">'+esc(details)+'</div><div class="skill-actions">'+skillActionButtons()+'</div></div>'+
      '<div class="skill-layout"><div class="card card-padding">'+cardTitle("SKILL.md Preview",badge("Portable format","blue"))+'<pre class="skill-code">'+esc(skillText)+'</pre><div class="footer-note">示例文件来源于固定 Demo 规则，不包含用户对话、真实密钥或真实项目数据。</div></div><div><div class="card card-padding">'+cardTitle("Release gates")+skillTimeline()+'</div><div class="card card-padding" style="margin-top:14px">'+cardTitle("Version history")+'<div class="skill-version"><div><strong>v0.2.0</strong><small>Candidate build · this demo</small></div>'+badge(stageLabels[current],stageTones[current])+'</div><div class="skill-version"><div><strong>v0.1.0</strong><small>Existing stable · synthetic</small></div>'+badge(current==="active"?"Superseded":"Active",current==="active"?"slate":"green")+'</div></div></div></div>'+
      '<div class="section-title"><h2>Evaluation & release evidence</h2></div>'+
      '<div class="card card-padding">'+(stageAtLeast("tested")||current==="rolled_back"?'<div class="row" style="justify-content:space-between;flex-wrap:wrap"><div><strong>Fixed Eval Suite · SIM-EVAL-001</strong><p class="muted small">15 synthetic tasks · pinned hypothetical model · independent acceptance simulated</p></div>'+badge("12 / 15 vs 9 / 15 baseline","green")+'</div><div class="callout" style="margin-top:12px"><strong>注意：</strong> 此处的“通过”是预设的交互演示数据，并非实际执行过的模型评测；不能据此声称产品提高了 20 个百分点。</div>':'<div class="empty"><strong>尚未运行评估</strong><p>批准候选经验后才可进入评估步骤。评估完成前不允许发布。</p></div>')+'</div>';
  }

  function renderPolicies(){
    var policies=[
      ["SEC-01","Sensitive Credential Detection","请求中的合成密钥、API Key、密码字段","Block before provider","green","lock"],
      ["SEC-02","Agent Tool Approval","高风险本地命令应在执行点要求审批","Requires Hook","amber","shield"],
      ["SEC-03","Streaming Output Guard","分段放行或缓冲时才有阻断能力","Mode-dependent","blue","activity"]
    ];
    var result=state.policyResult;
    var panel=result ? '<div class="sim-output"><div class="row" style="justify-content:space-between;margin-bottom:12px"><strong>本地扫描结果</strong>'+badge(result.block?"Simulated BLOCK":"Simulated ALLOW",result.block?"red":"green")+'</div><div class="mono">'+esc(result.redacted)+'</div><p class="subtle" style="margin:10px 0 0">'+esc(result.reason)+'</p></div>' : '<div class="sim-output"><p class="muted" style="margin:0;font-size:12px">点击“运行本地检查”查看预设规则如何识别示例文本。不会向服务器发送任何数据。</p></div>';
    return pageHead("RUNTIME PROTECTION","Policies & Guardrails","区分实时拦截、仅审计以及 Agent 执行点的权限控制。下面的扫描器仅使用浏览器内的示例正则，不是生产防护引擎。",viewButton("audit","查看阻断事件"))+
      '<div class="split-grid"><div class="card card-padding">'+cardTitle("Policy catalog",badge("3 sample policies","blue"))+'<div class="policy-list">'+policies.map(function(p){return '<div class="policy-item"><span class="policy-ico">'+icon(p[5])+'</span><div class="grow"><strong>'+p[0]+' · '+p[1]+'</strong><small>'+p[2]+'</small></div>'+badge(p[3],p[4])+'</div>';}).join("")+'</div><div class="footer-note">SEC-02 的执行点控制无法仅靠 HTTP Gateway 证明。SEC-03 的 audit-only 模式不能撤回已送达的字节。</div></div><div class="card card-padding">'+cardTitle("Input policy playground",badge("Browser only","blue"))+'<label for="policy-input" class="small muted">输入合成配置文本（请勿粘贴真实密钥）</label><textarea id="policy-input" class="textarea" spellcheck="false" style="margin:9px 0" placeholder="示例：api_key=sk-demo-12345678">'+(result?esc(result.original):"api_key=sk-demo-12345678\n请检查这段示例配置")+'</textarea><div class="row" style="margin:0 0 15px">'+btn(icon("scan")+" 运行本地检查","scanPolicy",'',"button-primary")+btn("恢复示例","resetPolicy",'',"button-sm")+'</div>'+panel+'</div></div>';
  }
  function scanPolicy(){
    var input=document.getElementById("policy-input");
    if(!input)return;
    var value=input.value;
    var block=/(?:sk[-_](?:demo|test|live)[-_]?[A-Za-z0-9_-]{6,}|(?:api[_-]?key|password|secret|token)\s*[:=]\s*\S+)/i.test(value);
    var redacted=value.replace(/(?:sk[-_](?:demo|test|live)[-_]?[A-Za-z0-9_-]{6,})/gi,"[REDACTED_TOKEN]").replace(/\b(api[_-]?key|password|secret|token)(\s*[:=]\s*)(\S+)/gi,"$1$2[REDACTED]");
    state.policyResult={original:value,block:block,redacted:redacted,reason:block?"SEC-01 命中：在本地模拟阻断，并对显示内容脱敏。没有真实向上游发送。":"SEC-01 未命中示例规则。真实防护还需要更完整的检测与风险评估。"};
    render();
    toast(block?"模拟策略已阻断敏感输入":"本地检测完成：未命中示例模式");
  }

  function renderIntegrations(){
    var list=[
      ["Gateway adapter","LiteLLM-compatible gateway","L0 · 仅请求/响应和网关策略可见","Fixture only","scan"],
      ["Agent Hook","Codex / Claude Code / OpenCode","L1 · 工具执行信息需要单独适配","Fixture only","terminal"],
      ["Independent verifier","CI / test / human acceptance","L2 · 外部验证结果定义任务验收","Fixture only","check"]
    ];
    return pageHead("DATA COVERAGE","Integrations","展示 TraceMason 需要的三层接入。这里的连接状态全部是产品设计样本，不代表已连接你的账户或模型服务。",viewButton("quality","查看证据覆盖"))+
      '<div class="integration-grid">'+list.map(function(p){return '<div class="card integration-card"><div class="integration-icon">'+icon(p[4])+'</div><h3>'+p[0]+'</h3><p><strong>'+p[1]+'</strong><br>'+p[2]+'</p>'+badge(p[3],"slate")+'</div>';}).join("")+'</div>'+
      '<div class="section-title"><h2>Capabilities & trust boundaries</h2></div><div class="card card-padding"><div class="feature-list">'+[
       ["Gateway L0","模型请求、响应、成本、路由与策略决策可见","yes"],
       ["Agent Hook L1","本地工具调用、退出码、变更摘要可见","no"],
       ["Verifier L2","CI、测试、人工验收等独立证据可关联","no"],
       ["Strong enforcement","Shell/文件/网络权限由实际执行点实施","no"]
      ].map(function(line){return '<div class="feature-line '+(line[2]==="no"?"no":"")+'">'+icon(line[2]==="yes"?"check":"info")+'<div><strong>'+line[0]+'</strong><span class="muted small"> — '+line[1]+'</span></div></div>';}).join("")+'</div></div>'+
      '<div class="section-title"><h2>Data pipeline (concept)</h2></div><div class="card card-padding"><div class="workflow-steps">'+[
       ["Gateway","request / response"],["Policy","pre-send decisions"],["Evidence","Hook + CI"],["Experience","candidate + review"],["Registry","tested Skill"]
      ].map(function(x,i){return '<div class="workflow-step"><div class="step-id">0'+(i+1)+'</div><strong>'+x[0]+'</strong><small>'+x[1]+'</small></div>';}).join("")+'</div><div class="footer-note">真正接入时必须测试身份关联、事件顺序、流式输出、最小权限和数据删除能力。</div></div>';
  }

  function showModal(title,body,confirmText,confirmAction){
    document.getElementById("modal-root").innerHTML='<div class="modal-overlay" data-action="closeModal"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-head"><h2 id="modal-title">'+esc(title)+'</h2><button class="icon-button" data-action="closeModal" aria-label="关闭">'+icon("x")+'</button></div><div class="modal-body">'+body+'</div><div class="modal-actions"><button class="button" data-action="closeModal">取消</button><button class="button button-primary" data-action="'+confirmAction+'">'+esc(confirmText)+'</button></div></div></div>';
    document.querySelector("#modal-root .modal").addEventListener("click",function(e){e.stopPropagation();});
    document.querySelector("#modal-root .modal .button-primary").focus();
  }
  function closeModal(){document.getElementById("modal-root").innerHTML="";}

  function applyAction(action){
    if(action==="reset"){showModal("重置交互演示","<p>将清除本页的临时评审、模拟评估与发布状态，所有数据会恢复为最初的候选经验。</p><p><strong>不涉及任何真实后端数据。</strong></p>","确认重置","confirmReset");return;}
    if(action==="confirmReset"){state={page:"overview",selected:"evt-101",auditSearch:"",auditRisk:"all",stage:"candidate",policyResult:null};closeModal();render();toast("演示已重置到初始状态");return;}
    if(action==="guide"){flowAction();return;}
    if(action==="approveExperience"){
      if(state.stage!=="candidate")return;
      state.stage="draft";render();toast("经验已模拟通过审核 · Skill v0.2.0 Draft 已生成");return;
    }
    if(action==="rejectExperience"){
      if(state.stage!=="candidate")return;
      state.stage="rejected";render();toast("候选已标记为 Rejected");return;
    }
    if(action==="evaluate"){
      if(state.stage!=="draft")return;
      state.stage="tested";render();toast("模拟评估完成：12/15（对照 9/15），并非真实模型测试");return;
    }
    if(action==="approveSkill"){
      if(state.stage!=="tested")return;
      state.stage="approved";render();toast("版本已通过模拟审批，允许进入灰度部署");return;
    }
    if(action==="canary"){
      if(state.stage!=="approved")return;
      state.stage="canary";render();toast("v0.2.0 已模拟发布到 1/3 个目标 Agent");return;
    }
    if(action==="promote"){
      if(state.stage!=="canary")return;
      state.stage="active";render();toast("v0.2.0 已模拟推广到 Active");return;
    }
    if(action==="rollback"){
      if(state.stage!=="canary"&&state.stage!=="active")return;
      state.stage="rolled_back";render();toast("模拟回滚完成：目标版本恢复 v0.1.0");return;
    }
    if(action==="copySkill"){
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(skillText).then(function(){toast("SKILL.md 示例内容已复制");}).catch(function(){toast("无法访问剪贴板，请手动选择代码复制");});
      }else toast("当前浏览器不支持剪贴板写入，请手动复制");
      return;
    }
    if(action==="scanPolicy"){scanPolicy();return;}
    if(action==="resetPolicy"){state.policyResult=null;render();toast("已恢复模拟示例");return;}
    if(action==="inspectFailure"){state.selected="evt-101";navigate("audit");return;}
    if(action==="closeModal"){closeModal();return;}
  }

  document.addEventListener("click",function(event){
    var p=event.target.closest("[data-page]");
    if(p){navigate(p.getAttribute("data-page"));return;}
    var inspect=event.target.closest("[data-inspect]");
    if(inspect){state.selected=inspect.getAttribute("data-inspect");navigate("audit");return;}
    var trace=event.target.closest("[data-trace]");
    if(trace){state.selected=trace.getAttribute("data-trace");updateAudit();return;}
    var action=event.target.closest("[data-action]");
    if(action)applyAction(action.getAttribute("data-action"));
  });
  document.addEventListener("keydown",function(event){
    if(event.key==="Escape")closeModal();
    if(event.key==="Enter" || event.key===" "){
      var trace=event.target.closest("[data-trace]");
      if(trace){event.preventDefault();state.selected=trace.getAttribute("data-trace");updateAudit();}
    }
  });
  document.addEventListener("input",function(event){
    if(event.target.id==="audit-search"){state.auditSearch=event.target.value;updateAudit();}
  });
  document.addEventListener("change",function(event){
    if(event.target.id==="risk-filter"){state.auditRisk=event.target.value;updateAudit();}
  });
  document.getElementById("menu-toggle").addEventListener("click",function(){
    var sidebar=document.getElementById("sidebar");
    var show=!sidebar.classList.contains("is-open");
    sidebar.classList.toggle("is-open",show);
    this.setAttribute("aria-expanded",String(show));
  });

  document.querySelectorAll("[data-icon]").forEach(function(n){n.innerHTML=icon(n.getAttribute("data-icon"));});
  render();
})();
