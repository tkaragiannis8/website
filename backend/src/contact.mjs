import {createHash} from 'node:crypto';
import nodemailer from 'nodemailer';
export const MAX_BYTES=32768;
const required=['ZOHO_SMTP_HOST','ZOHO_SMTP_PORT','ZOHO_SMTP_USER','ZOHO_SMTP_PASSWORD','MAIL_FROM','MAIL_TO','ALLOWED_ORIGINS'];
const list=value=>(value||'').split(',').map(x=>x.trim()).filter(Boolean);
const hash=value=>createHash('sha256').update(value).digest('hex');
const mailText=({name,email,message,lang})=>[
 `New website contact request (${lang})`,
 '',
 `Name: ${name}`,
 `Email: ${email}`,
 '',
 message
].join('\n');

function createZohoMailer(env){
 const port=Number(env.ZOHO_SMTP_PORT);
 const transport=nodemailer.createTransport({
  host:env.ZOHO_SMTP_HOST,
  port,
  secure:String(env.ZOHO_SMTP_SECURE??(port===465)).toLowerCase()==='true',
  auth:{user:env.ZOHO_SMTP_USER,pass:env.ZOHO_SMTP_PASSWORD}
 });
 return message=>transport.sendMail(message);
}

// Per-process protection. Production also requires a gateway limit shared across instances.
export function createContactHandler({env=process.env,fetchImpl=fetch,now=Date.now,sendMailImpl}={}){
 const captchaRequired=String(env.RECAPTCHA_REQUIRED??'true').toLowerCase()!=='false';
 const configured=[...required,...(captchaRequired?['RECAPTCHA_SECRET_KEY','RECAPTCHA_ALLOWED_HOSTNAMES']:[])];
  const sendMail=sendMailImpl||createZohoMailer(env);
 const clients=new Map();const tokens=new Map();
 return async function contact({method,origin='',contentType='',rawBody='',ip='unknown'}){
  const allowed=list(env.ALLOWED_ORIGINS).includes(origin);
  const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Origin','X-Content-Type-Options':'nosniff'};
  if(allowed)headers['Access-Control-Allow-Origin']=origin;
  const reply=(status,code)=>({status,headers,body:JSON.stringify({ok:status>=200&&status<300,code})});
  if(!allowed)return reply(403,'origin_not_allowed');
  if(method==='OPTIONS'){headers['Access-Control-Allow-Methods']='POST, OPTIONS';headers['Access-Control-Allow-Headers']='Content-Type';return {status:204,headers,body:''};}
  if(method!=='POST')return reply(405,'method_not_allowed');
  if(!configured.every(k=>env[k]?.trim()))return reply(503,'not_configured');
  const time=now();
  for(const [k,v] of clients)if(v.until<=time)clients.delete(k);
  for(const [k,v] of tokens)if(v<=time)tokens.delete(k);
  const clientKey=hash(ip);const previous=clients.get(clientKey)||{count:0,until:time+60000};
  if(previous.count>=5||clients.size>=10000){headers['Retry-After']='60';return reply(429,'rate_limited');}
  previous.count++;clients.set(clientKey,previous);
  if(!/^application\/json(?:;|$)/i.test(contentType))return reply(415,'json_required');
  if(Buffer.byteLength(rawBody)>MAX_BYTES)return reply(413,'body_too_large');
  let body;try{body=JSON.parse(rawBody);}catch{return reply(400,'invalid_json');}
  if(!body||typeof body!=='object'||Array.isArray(body))return reply(400,'invalid_fields');
  const {name,email,message,captchaToken,consent,website='',lang='en'}=body;
  if(typeof name!=='string'||!name.trim()||name.length>100||/[\r\n]/.test(name)||typeof email!=='string'||email.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(email)||typeof message!=='string'||message.trim().length<10||message.length>5000||consent!==true||typeof website!=='string'||website!==''||!['en','el','ru'].includes(lang)||(captchaRequired&&(typeof captchaToken!=='string'||!captchaToken||captchaToken.length>4096)))return reply(400,'invalid_fields');
  if(captchaRequired){
   const tokenKey=hash(captchaToken);
   if(tokens.has(tokenKey)||tokens.size>=10000)return reply(409,'duplicate_submission');
   tokens.set(tokenKey,time+180000);
  }
  try{
   if(captchaRequired){
    const response=await fetchImpl('https://www.google.com/recaptcha/api/siteverify',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({secret:env.RECAPTCHA_SECRET_KEY,response:captchaToken}),signal:AbortSignal.timeout(8000)});
    if(!response.ok)return reply(502,'verification_unavailable');
    const captcha=await response.json();const age=time-Date.parse(captcha.challenge_ts);
    if(captcha.success!==true||typeof captcha.score!=='number'||!Number.isFinite(captcha.score)||captcha.score<0.5||captcha.action!=='submit'||!list(env.RECAPTCHA_ALLOWED_HOSTNAMES).includes(captcha.hostname)||!Number.isFinite(age)||age< -10000||age>120000)return reply(400,'captcha_failed');
   }
   await sendMail({
    from:env.MAIL_FROM,
    to:env.MAIL_TO,
    replyTo:email.trim(),
    subject:`Website contact form — ${name.trim()}`,
    text:mailText({name:name.trim(),email:email.trim(),message:message.trim(),lang})
   });
   return reply(200,'sent');
  }catch{return reply(502,'service_unavailable');}
 };
}
