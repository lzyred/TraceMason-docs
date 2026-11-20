/* UI depends on this client only. Replace injected mock with same-origin transport after implementation. */
(function(root){
'use strict';
class ProviderClient{
 constructor(transport){this.transport=transport;this.etag=null;this.token=null;}
 async request(method,path,body,expectedTag=this.etag,signal){const headers={};if(method!=='GET'){if(!this.token)await this.session();headers['X-TraceMason-Token']=this.token;headers['If-Match']=expectedTag;}
 const r=await this.transport.request(method,path,body,headers,signal);
 if(r.status<200||r.status>=300){if(r.status===403)this.token=null;const e=new Error(r.body.error.message);Object.assign(e,r.body.error,{status:r.status});throw e;}
 if(path!=='/api/session'&&r.headers.ETag)this.etag=r.headers.ETag;return r.body;}
 async session(){this.token=(await this.request('GET','/api/session')).token;}
 list(){return this.request('GET','/api/providers');}
 save(item,intent,etag=this.etag){return this.request('POST','/api/providers',{...item,intent},etag);}
 setEnabled(id,enabled){return this.request('POST','/api/providers/enabled',{id,enabled});}
 test(id,request,signal){return this.request('POST','/api/providers/test',{id,request},this.etag,signal);}
 remove(id,etag=this.etag){return this.request('DELETE','/api/providers/'+encodeURIComponent(id),undefined,etag);}
}
class SameOriginTransport{
 async request(method,path,body,headers={},signal){
 try{const r=await fetch(path,{method,headers:{...headers,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,credentials:'same-origin',cache:'no-store',signal:signal||AbortSignal.timeout(method==='POST'&&path.endsWith('/test')?65000:10000)});return {status:r.status,headers:{ETag:r.headers.get('ETag')},body:await r.json()};}
 catch(error){if(signal?.aborted)throw new DOMException('检查已取消','AbortError');return {status:0,headers:{},body:{error:{code:method==='GET'?'service_unavailable':'outcome_unknown',message:root.ProviderContract.labels[method==='GET'?'service_unavailable':'outcome_unknown']}}};}
 }
}
root.ProviderClient=ProviderClient;root.SameOriginProviderTransport=SameOriginTransport;
})(globalThis);
