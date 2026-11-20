/* Lossless raw bodies remain available separately; this is a derived reading view. */
(function(root){
'use strict';
const list=v=>Array.isArray(v)?v:[];
const stringify=v=>typeof v==='string'?v:JSON.stringify(v,null,2)??'';
const roles={system:'系统指令',developer:'开发者指令',user:'用户',assistant:'模型',tool:'工具结果'};
function message(item,source='input'){
 if(typeof item==='string')return [{role:source==='input'?'user':'assistant',label:source==='input'?'用户':'模型回复',text:item}];
 if(!item||typeof item!=='object')return [{role:'other',label:'其他内容',text:stringify(item)}];
 const kind=item.type||'',role=item.role||(source==='output'?'assistant':'other');
 const base={role,label:roles[role]||'其他内容',id:item.id||item.call_id||'',type:kind};
 if(kind==='function_call'||kind==='custom_tool_call')return [{...base,role:'call',label:'工具调用',name:item.name||'未命名工具',id:item.call_id||item.id||'',text:stringify(item.arguments??item.input??'')}];
 if(kind==='function_call_output'||kind==='custom_tool_call_output'||role==='tool')return [{...base,role:'tool',label:'工具结果',id:item.call_id||item.tool_call_id||item.id||'',text:stringify(item.output??item.content??'')}];
 if(kind==='reasoning'){
  const parts=list(item.summary).concat(list(item.content));
  const text=parts.map(p=>p.text||'').filter(Boolean).join('\n\n');
  return [{...base,role:'reasoning',label:'上游返回的推理摘要',text:text||'上游未返回可读的推理文本。',extra:item.encrypted_content?'包含不可直接阅读的加密内容，见原文。':undefined}];
 }
 if(kind.endsWith('_call'))return [{...base,role:'call',label:'内置工具调用',name:kind,text:stringify(item)}];
 if(kind==='message'||item.role||item.content!=null){
  const parts=typeof item.content==='string'?[{type:'text',text:item.content}]:list(item.content);
  const cards=[],texts=[];
  for(const part of parts){
   if(typeof part==='string')texts.push(part);
   else if(part&&typeof part==='object'){
    if(typeof part.text==='string')texts.push(part.text);
    else if(part.type==='refusal')texts.push(part.refusal||'');
    else cards.push({...base,role:'attachment',label:'附件 / 非文本内容',text:stringify(part)});
   }
  }
  if(texts.length)cards.unshift({...base,text:texts.join('\n\n')});
  if(item.refusal)cards.push({...base,label:'模型拒绝',text:stringify(item.refusal)});
  if(item.reasoning_content)cards.push({...base,role:'reasoning',label:'上游返回的推理文本',text:stringify(item.reasoning_content)});
  for(const tool of list(item.tool_calls))cards.push({role:'call',label:'工具调用',name:tool.function?.name||tool.name||'未命名工具',id:tool.id||'',text:stringify(tool.function?.arguments??tool.arguments??'')});
  return cards.length?cards:[{...base,text:'（空消息）'}];
 }
 return [{...base,role:'other',label:kind||'其他内容',text:stringify(item)}];
}
function request(raw){
 let data;try{data=JSON.parse(raw);}catch{return {cards:[],tools:[],notes:['请求不是可解析的 JSON，请查看发送原文。']};}
 const cards=[];if(data.instructions)cards.push({role:'system',label:'请求指令 · instructions',text:stringify(data.instructions)});
 const input=data.input??data.messages;
 if(typeof input==='string')cards.push(...message(input));
 else for(const item of list(input))cards.push(...message(item));
 const names=new Map(cards.filter(c=>c.role==='call'&&c.id).map(c=>[c.id,c.name]));
 for(const card of cards)if(card.role==='tool'&&names.has(card.id))card.name=names.get(card.id);
 const notes=[];if(data.previous_response_id)notes.push(`上游历史引用：${data.previous_response_id}。这部分历史不包含在本次正文中。`);
 if(data.conversation)notes.push('本次请求引用上游会话；阅读视图仅展示本次正文携带的内容。');
 return {cards,tools:list(data.tools),notes};
}
function response(raw){
 const records=new Map(),ids=new Map(),notes=[],extras=[],chat=new Map();let eventCount=0,malformed=0;
 const record=e=>{
  let key=e.item_id&&ids.get(e.item_id);
  if(key==null)key=e.output_index!=null?'index:'+e.output_index:e.item_id?'id:'+e.item_id:'index:0';
  if(!records.has(key))records.set(key,{item:null,text:new Map(),summary:new Map(),args:'',tool:false});
  if(e.item_id)ids.set(e.item_id,key);
  return records.get(key);
 };
 const setItem=(item,index,final=false)=>{
  if(!item||typeof item!=='object')return;
  const r=record({item_id:item.id,output_index:index});r.item=item;r.final=final;
 };
 function apply(e){
  if(!e||typeof e!=='object')return;
  const type=typeof e.type==='string'?e.type:'';eventCount++;
  if(type==='response.output_item.added'||type==='response.output_item.done'){setItem(e.item,e.output_index,type.endsWith('.done'));return;}
  if(['response.output_text.delta','response.output_text.done','response.refusal.delta','response.refusal.done'].includes(type)){
   const r=record(e),k=e.content_index??0;const value=e.delta??e.text??e.refusal??'';
   if(typeof value==='string')r.text.set(k,type.endsWith('.delta')?(r.text.get(k)||'')+value:value);return;
  }
  if(type==='response.content_part.added'||type==='response.content_part.done'){
   const r=record(e),part=e.part||{},text=part.text??part.refusal;
   if(typeof text==='string')r.text.set(e.content_index??0,text);return;
  }
  if(type.startsWith('response.reasoning_summary_text.')||type.startsWith('response.reasoning_text.')){
   const r=record(e),k=e.summary_index??e.content_index??0,v=e.delta??e.text??'';
   if(typeof v==='string')r.summary.set(k,type.endsWith('.delta')?(r.summary.get(k)||'')+v:v);return;
  }
  if(type.startsWith('response.function_call_arguments.')||type.startsWith('response.custom_tool_call_input.')){
   const r=record(e);r.tool=true;const v=e.delta??e.arguments??e.input??'';
   if(typeof v==='string')r.args=type.endsWith('.delta')?r.args+v:v;return;
  }
  if(type==='error'||e.error){extras.push({role:'error',label:'上游错误',text:stringify(e.error||e)});}
  const res=e.response||e;
  if(Array.isArray(res.output))res.output.forEach((item,index)=>setItem(item,index,true));
  if(['failed','incomplete','cancelled'].includes(res.status)){
   const note=`上游响应状态：${res.status}`;if(!notes.includes(note))notes.push(note);
   if(res.error||res.incomplete_details)extras.push({role:'error',label:'未完成原因',text:stringify(res.error||res.incomplete_details)});
  }
  if(typeof res.output_text==='string'&&!res.output)record({output_index:0}).text.set(0,res.output_text);
  for(const choice of list(e.choices)){
   const index=choice.index??0;if(!chat.has(index))chat.set(index,{content:'',reasoning_content:'',refusal:'',calls:new Map()});
   const c=chat.get(index),m=choice.message||choice.delta||{},full=Boolean(choice.message);
   for(const key of ['content','reasoning_content','refusal'])if(typeof m[key]==='string')c[key]=full?m[key]:c[key]+m[key];
   list(m.tool_calls).forEach((t,i)=>{
    const key=t.index??i;if(!c.calls.has(key))c.calls.set(key,{id:'',function:{name:'',arguments:''}});
    const call=c.calls.get(key);if(t.id)call.id=t.id;
    for(const f of ['name','arguments'])if(typeof t.function?.[f]==='string')call.function[f]=full?t.function[f]:call.function[f]+t.function[f];
   });
  }
  if(!type&&!res.output&&!e.choices&&!e.error&&!res.output_text)extras.push({role:'other',label:'其他返回内容',text:stringify(e)});
  else if(type&&!type.startsWith('response.')&&type!=='error')extras.push({role:'other',label:'其他事件 · '+type,text:stringify(e)});
 }
 const trimmed=raw.trim();
 if(trimmed.startsWith('{')||trimmed.startsWith('[')){
  try{apply(JSON.parse(trimmed));}catch{malformed++;}
 }else{
  let lines=[];
  function flush(){if(!lines.length)return;const value=lines.join('\n');lines=[];if(value==='[DONE]')return;try{apply(JSON.parse(value));}catch{malformed++;}}
  for(const line of raw.split(/\r?\n/)){
   if(line==='')flush();else if(line.startsWith('data:'))lines.push(line.slice(5).replace(/^ /,''));
  }
  if(lines.length){malformed++;notes.push('末尾事件尚未完整接收，已保留在原文中。');}
 }
 const cards=[];
 for(const r of records.values()){
  const item=r.item;
  if(item){
   const copy={...item};
   if(['function_call','custom_tool_call'].includes(item.type)){
    const key=item.type==='function_call'?'arguments':'input';if((!r.final||!copy[key])&&r.args)copy[key]=r.args;
   }else if(item.type==='reasoning'){
    if((!r.final||!list(copy.summary).some(p=>p.text))&&r.summary.size)copy.summary=[{text:[...r.summary.values()].join('\n\n')}];
   }else if(r.text.size&&(!r.final||!list(copy.content).some(p=>p.text||p.refusal)))copy.content=[{type:'output_text',text:[...r.text.values()].join('\n\n')}];
   cards.push(...message(copy,'output'));
  }else if(r.tool)cards.push({role:'call',label:'工具调用 · 未完整返回',name:'未返回工具名称',text:r.args});
  else{
   if(r.summary.size)cards.push({role:'reasoning',label:'上游返回的推理摘要',text:[...r.summary.values()].join('\n\n')});
   if(r.text.size)cards.push({role:'assistant',label:'模型回复',text:[...r.text.values()].join('\n\n')});
  }
 }
 for(const [index,c] of chat)cards.push(...message({role:'assistant',content:c.content,reasoning_content:c.reasoning_content,refusal:c.refusal,tool_calls:[...c.calls.values()]},'output').map(card=>({...card,choice:index})));
 if(malformed)notes.push(`${malformed} 个事件或正文片段未能解析；请查看返回原文。`);
 return {cards:cards.concat(extras),notes,eventCount};
}
function userText(raw){
 let data;try{data=JSON.parse(raw);}catch{return '';}
 const input=data.input??data.messages;
 const items=typeof input==='string'?[{role:'user',content:input}]:list(input);
 const texts=[];
 for(const item of items){
  if(!item||item.role!=='user')continue;
  const parts=typeof item.content==='string'?[{text:item.content}]:list(item.content);
  for(const part of parts){
   if(typeof part?.text!=='string')continue;
   let text=part.text;
   // Exclude whole known injected messages; never strip tags inside a user's prose.
   const trimmed=text.trim();
   if(/^<environment_context>[\s\S]*<\/environment_context>$/.test(trimmed))continue;
   if(/^# AGENTS\.md instructions for /.test(trimmed))continue;
   const titlePrefix='Generate a concise, single-line task title';
   if(text.startsWith(titlePrefix)&&text.includes('\n\nUser prompt:\n'))text=text.slice(text.indexOf('\n\nUser prompt:\n')+'\n\nUser prompt:\n'.length);
   if(text.length)texts.push(text);
  }
 }
 return texts.join('\n\n');
}
const reader={request,response,userText};
if(typeof module!=='undefined'&&module.exports)module.exports=reader;else root.TraceReader=reader;
})(typeof globalThis!=='undefined'?globalThis:this);
