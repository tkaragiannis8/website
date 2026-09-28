import {app} from '@azure/functions';
import {createContactHandler,MAX_BYTES} from './contact.mjs';
const handle=createContactHandler();
app.http('contact',{route:'contact',methods:['POST','OPTIONS'],authLevel:'anonymous',handler:async request=>{
 let rawBody='';let size=0;const parts=[];
 if(request.body){const reader=request.body.getReader();try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_BYTES){await reader.cancel();return {status:413,jsonBody:{ok:false,code:'body_too_large'}};}parts.push(value);}}finally{reader.releaseLock();}rawBody=Buffer.concat(parts).toString('utf8');}
 return handle({method:request.method,origin:request.headers.get('origin')||'',contentType:request.headers.get('content-type')||'',rawBody,ip:request.headers.get('x-azure-clientip')||'unknown'});
}});
app.http('health',{route:'health',methods:['GET'],authLevel:'anonymous',handler:async()=>({status:200,jsonBody:{status:'up'}})});
