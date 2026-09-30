import {languages,legacy,url} from '../data/site.js';
const escapeXml=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');
export function GET({site}){
 const keys=[...legacy.en.map(p=>p.key),'privacy'];
 const urls=keys.map(key=>{
  const variants=languages.map(lang=>({lang,href:new URL(url(lang,key),site).href}));
  return '<url><loc>'+escapeXml(variants[0].href)+'</loc>'+variants.map(v=>'<xhtml:link rel="alternate" hreflang="'+v.lang+'" href="'+escapeXml(v.href)+'"/>').join('')+'<xhtml:link rel="alternate" hreflang="x-default" href="'+escapeXml(variants.find(v=>v.lang==='en').href)+'"/></url>';
 }).join('');
 return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'+urls+'</urlset>',{headers:{'Content-Type':'application/xml; charset=utf-8'}});
}
