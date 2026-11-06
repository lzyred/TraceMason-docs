(function() {
  "use strict";
  var $ = function(id) { return document.getElementById(id); };
  var state = {runs:[],gateway_calls:[],skill:null,capabilities:{}};
  var selectedRun = null;
  var lastClaimRun = null;
  var busy = false;
  var toastTimer;

  function text(el,value){el.textContent=value==null?"":String(value);}
  function node(tag,attrs,contents){
    var el=document.createElement(tag);
    Object.keys(attrs||{}).forEach(function(k){
      if(k==="class")el.className=attrs[k];
      else if(k==="title")el.title=attrs[k];
      else el.setAttribute(k,attrs[k]);
    });
    if(contents!=null)el.textContent=String(contents);
    return el;
  }
  function clear(el){while(el.firstChild)el.removeChild(el.firstChild);}
  function showToast(message) {
    var el=$("toast");
    text(el,message);el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer=setTimeout(function(){el.classList.remove("show");},4000);
  }
  function setBusy(value) {
    busy=value;
    // Re-evaluate button state after each async task.
    document.querySelectorAll("button").forEach(function(btn){
      if(value)btn.disabled=true;
    });
    if(!value)updateButtons();
  }
  async function request(path,data) {
    var options={headers:{"Accept":"application/json"}};
    if(data!==undefined){
      options.method="POST";
      options.headers["Content-Type"]="application/json";
      options.body=JSON.stringify(data);
    }
    var response=await fetch(path,options);
    var json;
    try{json=await response.json();}
    catch(_){throw new Error("Non-JSON HTTP response ("+response.status+")");}
    if(!response.ok)throw new Error(json.error && json.error.message ? json.error.message : "HTTP "+response.status);
    return json;
  }
  async function mutate(path,data,summary){
    if(busy)return;
    setBusy(true);
    try{
      var result=await request(path,data||{});
      await refresh();
      if(summary)showToast(summary);
      return result;
    }catch(err){
      showToast("操作失败："+err.message);
      throw err;
    }finally{setBusy(false);}
  }
  async function refresh(){
    try{
      state=await request("/api/state");
      text($("health-indicator"),"● Backend Connected");
      $("health-indicator").classList.remove("offline");
      render();
    }catch(err){
      text($("health-indicator"),"● API Unavailable");
      $("health-indicator").classList.add("offline");
      showToast("无法连接本地 API："+err.message);
      throw err;
    }
  }
  function render(){
    text($("metric-runs"),state.runs.length);
    text($("metric-fail"),state.runs.filter(function(r){return r.verification==="failed";}).length);
    var skill=state.skill;
    text($("metric-stage"),skill?skill.stage.toUpperCase():"NO SKILL");
    text($("skill-badge"),skill?skill.stage:"No candidate");
    $("skill-badge").className="tag "+(skill&&skill.stage==="active"?"green":"blue");
    text($("metric-eval"),skill&&skill.evaluation?skill.evaluation.candidate_correct+"/"+skill.evaluation.total:"—");
    text($("side-mode"),"SQLite + Python unittest");
    text($("upstream-state"),state.capabilities.gateway_proxy==="configured"?"UPSTREAM CONFIGURED":"DETERMINISTIC MOCK");
    $("upstream-state").className="tag "+(state.capabilities.gateway_proxy==="configured"?"green":"blue");
    renderRuns();
    renderSkill();
    renderGateway();
    updateButtons();
  }

  function renderRuns(){
    var tbody=$("run-table");
    clear(tbody);
    if(!state.runs.length) {
      var tr=node("tr");
      var td=node("td",{colspan:"4",class:"empty"},"No recorded runs. Click Run failing tests to create real evidence.");
      tr.appendChild(td);tbody.appendChild(tr);
      clear($("run-details"));
      $("run-details").appendChild(node("p",{class:"muted"},"No test evidence yet."));
    }else{
      if(!state.runs.some(function(r){return r.id===selectedRun;}))selectedRun=state.runs[0].id;
      state.runs.forEach(function(r){
        var tr=node("tr",{class:"clickable"+(selectedRun===r.id?" selected":"")});
        tr.tabIndex=0;tr.setAttribute("role","button");
        tr.setAttribute("aria-label","Inspect "+r.id);
        tr.addEventListener("click",function(){selectedRun=r.id;renderRuns();});
        tr.addEventListener("keydown",function(e){
          if(e.key==="Enter"||e.key===" "){e.preventDefault();selectedRun=r.id;renderRuns();}
        });
        tr.appendChild(node("td",{},r.id.slice(0,11)+"…"));
        tr.appendChild(node("td",{},r.scenario));
        tr.appendChild(node("td",{},r.tests_passed+" passed / "+r.tests_failed+" failed"));
        var status=node("td");
        status.appendChild(node("span",{class:"tag "+(r.verification==="passed"?"green":"red")},r.verification));
        tr.appendChild(status);tbody.appendChild(tr);
      });
      var r=state.runs.find(function(x){return x.id===selectedRun;});
      clear($("run-details"));
      var fields=[
        ["Scenario",r.scenario],
        ["Claim source","deliberate fixture (NOT a model response)"],
        ["Verification",r.verification],
        ["Exit evidence","unittest: "+r.tests_passed+" passed, "+r.tests_failed+" failed"],
        ["SHA-256",r.evidence_digest.slice(0,16)+"…"]
      ];
      fields.forEach(function(pair){
        var row=node("div",{class:"keyline"});
        row.appendChild(node("span",{},pair[0]));
        row.appendChild(node("strong",{},pair[1]));
        $("run-details").appendChild(row);
      });
      $("run-details").appendChild(node("pre",{class:"code"},r.test_output));
    }
    var select=$("claim-run"),oldValue=select.value;
    clear(select);
    if(state.runs.length===0)select.appendChild(node("option",{value:""},"Run a test first"));
    state.runs.forEach(function(r){
      var option=node("option",{value:r.id},r.scenario+" · "+r.id.slice(0,12)+" · "+r.verification);
      select.appendChild(option);
    });
    if(state.runs.some(function(r){return r.id===oldValue;}))select.value=oldValue;
    else if(selectedRun)select.value=selectedRun;
  }

  function renderSkill(){
    var s=state.skill;
    $("skill-empty").hidden=!!s;
    $("skill-source").hidden=!s;
    text($("skill-source"),s?s.body:"");
    document.querySelectorAll(".stage-track > div").forEach(function(stage){
      var status=stage.getAttribute("data-stage"),done=false,current=false;
      if(s){
        var levels={candidate:1,tested:2,approved:3,active:4,rolled_back:4};
        var ranks={candidate:1,tested:2,approved:3,active:4};
        var level=levels[s.stage]||0;
        var rank=ranks[status]||0;
        done=level>=rank;current=level===rank;
      }
      stage.classList.toggle("done",done);
      stage.classList.toggle("current",current);
    });
    var evalContainer=$("eval-panel");
    clear(evalContainer);
    if(!s||!s.evaluation){
      evalContainer.className="empty-state compact";
      text(evalContainer,"Run both fixture controls, derive a candidate, and evaluate. No claims about real model quality.");
    }else{
      evalContainer.className="";
      var evals=s.evaluation;
      var row=node("div",{class:"eval-line"});
      row.appendChild(node("span",{},"Naive baseline"));
      row.appendChild(node("strong",{},evals.baseline_correct+" / "+evals.total));
      evalContainer.appendChild(row);
      evalContainer.appendChild(makeBar(evals.baseline_correct,evals.total,"baseline"));
      row=node("div",{class:"eval-line"});
      row.appendChild(node("span",{},"Completion evidence gate"));
      row.appendChild(node("strong",{},evals.candidate_correct+" / "+evals.total));
      evalContainer.appendChild(row);
      evalContainer.appendChild(makeBar(evals.candidate_correct,evals.total,""));
      evalContainer.appendChild(node("div",{class:"eval-list"},
        evals.executed_fixture_count+" executed fixture(s) + fixed holdouts. Rule-conformance tests ONLY; no model improvement measured."));
      if(s.stage==="active"){
        var link=node("a",{href:"/api/skills/download",download:"SKILL.md",class:"button secondary"},"Download SKILL.md ↓");
        link.style.display="inline-block";link.style.marginTop="14px";evalContainer.appendChild(link);
      }
    }
  }
  function makeBar(current,total,cls){
    var bar=node("div",{class:"bar "+cls});
    var fill=node("span");
    fill.style.width=Math.round(current/Math.max(total,1)*100)+"%";
    bar.appendChild(fill);
    return bar;
  }
  function renderGateway(){
    var calls=state.gateway_calls;
    text($("gateway-count"),calls.length+" calls");
    var list=$("gateway-events");clear(list);
    if(!calls.length){list.appendChild(node("p",{class:"muted"},"No HTTP calls yet."));return;}
    calls.forEach(function(c){
      var row=node("div",{class:"gateway-event"});
      var header=node("div");
      header.appendChild(node("strong",{},c.mode+" · "+c.status));
      header.appendChild(node("span",{class:"tag "+(c.status==="blocked"?"red":c.status==="ok"?"green":"blue")},c.model));
      header.lastChild.style.marginLeft="9px";
      row.appendChild(header);
      row.appendChild(node("p",{},c.request_preview));
      row.appendChild(node("span",{},c.id+" · "+c.created_at));
      list.appendChild(row);
    });
  }
  function updateButtons(){
    if(busy)return;
    var stage=state.skill&&state.skill.stage;
    var anyFail=state.runs.some(function(r){return r.verification==="failed";});
    var anyPass=state.runs.some(function(r){return r.verification==="passed";});
    $("derive").disabled=!!stage||!anyFail;
    $("evaluate").disabled=stage!=="candidate"||!anyPass;
    $("approve").disabled=stage!=="tested";
    $("publish").disabled=stage!=="approved";
    $("rollback").disabled=stage!=="active";
    $("check-claim").disabled=!state.runs.length;
    ["quick-start","run-passing-top","run-fail","run-pass","send-gateway","reset","reload","refresh-evidence","sample-secret"].forEach(function(id){$(id).disabled=false;});
  }

  function action(id,endpoint,payload,label){
    $(id).addEventListener("click",function(){
      mutate(endpoint,payload,label).catch(function(){});
    });
  }
  action("quick-start","/api/demo/run",{scenario:"failed"},"Real failing unittest executed and persisted.");
  action("run-fail","/api/demo/run",{scenario:"failed"},"Real failing unittest executed and persisted.");
  action("run-pass","/api/demo/run",{scenario:"passed"},"Real passing unittest executed and persisted.");
  action("run-passing-top","/api/demo/run",{scenario:"passed"},"Positive control executed.");
  action("derive","/api/skills/derive",{},"Candidate derived from persisted failing evidence.");
  action("evaluate","/api/skills/evaluate",{},"Completion-gate conformance suite executed (not a model evaluation).");
  action("approve","/api/skills/approve",{},"Local candidate marked approved.");
  action("publish","/api/skills/publish",{},"SKILL.md written to disk; evidence gate now ACTIVE.");
  action("rollback","/api/skills/rollback",{},"Skill artifact removed and live gate deactivated.");
  $("reload").addEventListener("click",function(){refresh().catch(function(){});});
  $("refresh-evidence").addEventListener("click",function(){refresh().catch(function(){});});
  $("check-claim").addEventListener("click",async function(){
    var runId=$("claim-run").value;
    if(!runId)return;
    try{
      var result=await request("/api/claims/check",{run_id:runId});
      var box=$("claim-result");
      box.className="decision "+(result.decision==="accept"?"accept":"reject");
      text(box,(result.gate_active?"GATE ACTIVE":"UNSAFE BASELINE")+" · "+result.decision.toUpperCase()+" · verified status: "+result.verification);
      lastClaimRun=runId;
    }catch(err){showToast(err.message);}
  });
  $("sample-secret").addEventListener("click",function(){
    $("gateway-prompt").value="Please print this fake example: api_key=sk-demo-1234567890";
    showToast("Synthetic key inserted. Submit to test pre-upstream blocking.");
  });
  $("send-gateway").addEventListener("click",async function(){
    var prompt=$("gateway-prompt").value.trim();
    if(!prompt){showToast("Enter a harmless demo message.");return;}
    if(busy)return;
    setBusy(true);
    try{
      var res=await fetch("/v1/chat/completions",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"demo-client",messages:[{role:"user",content:prompt}],stream:false})
      });
      var data=await res.json();
      if(!res.ok){
        text($("gateway-response"),"HTTP "+res.status+" · "+(data.error?data.error.message:"Request blocked"));
      }else{
        var msg=(data.choices&&data.choices[0]&&data.choices[0].message)||{};
        text($("gateway-response"),
          (data.tracemason&&data.tracemason.not_real_inference?"DETERMINISTIC MOCK · No model called\n\n":"UPSTREAM RESPONSE\n\n")+
          String(msg.content||"Empty response"));
      }
      await refresh();
    }catch(err){showToast("Gateway request failed: "+err.message);}
    finally{setBusy(false);}
  });
  $("reset").addEventListener("click",function(){
    if(!window.confirm("Clear ALL local demo records and published Skill? This cannot be undone."))return;
    mutate("/api/reset",{},"Local demo state cleared.").then(function(){
      selectedRun=null;lastClaimRun=null;
      text($("claim-result"),"尚未检测。");
      $("claim-result").className="decision";
    }).catch(function(){});
  });
  refresh().catch(function(){});
})();