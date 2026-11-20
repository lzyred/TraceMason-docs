class ReviewTransport {
 constructor(){this.mock=new MockProviderTransport();}
 async request(method,path,body,headers,signal){
  if(path==='/api/provider-profiles')return {status:200,headers:{},body:{profiles:ReviewProfiles,gateway_url:'http://127.0.0.1:8768'}};
  if(signal?.aborted)throw new DOMException('已取消','AbortError');
  if(path==='/api/providers/test'&&window.GatewayWorkflow)return window.GatewayWorkflow.probe(this.mock,body,signal);
  const rid=path==='/api/providers/test'?window.ReviewRequests?.begin(this.mock.state.providers[body.id],body):null;
  try{const result=await this.mock.request(method,path,body,headers,signal);if(rid){result.body.request_id=rid;result.body.path=body.request?.path;window.ReviewRequests.finish(rid,result);}return result;}
  catch(error){if(rid)window.ReviewRequests.finish(rid,null,error.name==='AbortError');throw error;}
 }
}
