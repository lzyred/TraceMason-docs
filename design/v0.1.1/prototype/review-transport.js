class ReviewTransport {
 constructor(){this.mock=new MockProviderTransport();}
 async request(method,path,body,headers,signal){
  if(path==='/api/provider-profiles')return {status:200,headers:{},body:{profiles:ReviewProfiles,gateway_url:'http://127.0.0.1:8768'}};
  if(signal?.aborted)throw new DOMException('已取消','AbortError');
  return this.mock.request(method,path,body,headers);
 }
}
