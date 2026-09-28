import {createServer} from 'node:http';
import {createContactHandler,MAX_BYTES} from './contact.mjs';
const handle=createContactHandler();
createServer(async(req,res)=>{
 if(req.url==='/api/health'){res.writeHead(200,{'Content-Type':'application/json'});res.end('{"status":"up"}');return;}
 if(req.url!=='/api/contact'){res.writeHead(404);res.end();return;}
 let size=0;const chunks=[];
 for await(const chunk of req){size+=chunk.length;if(size>MAX_BYTES){res.writeHead(413);res.end();return;}chunks.push(chunk);}
 const result=await handle({method:req.method,origin:req.headers.origin||'',contentType:req.headers['content-type']||'',rawBody:Buffer.concat(chunks).toString('utf8'),ip:req.socket.remoteAddress||'unknown'});
 res.writeHead(result.status,result.headers);res.end(result.body);
}).listen(Number(process.env.PORT)||7071,'127.0.0.1',()=>console.log('Contact API at http://127.0.0.1:7071 (unconfigured providers return 503)'));
