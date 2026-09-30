import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readdir,readFile,access} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {load} from 'cheerio';
const root=new URL('../dist/',import.meta.url);
const source=JSON.parse(await readFile(new URL('../src/data/legacy.json',import.meta.url),'utf8'));
const base=(process.env.BASE_PATH||'').replace(/\/$/,'');
async function* walk(dir){if(dir instanceof URL)dir=fileURLToPath(dir);for(const e of await readdir(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory())yield*walk(p);else yield p;}}
test('all legacy pages render in all three languages with matching language switches',async()=>{
 for(const [lang,pages] of Object.entries(source))for(const p of pages){const relative=`${lang}/${p.key==='home'?'':p.key+'/'}index.html`;const $=load(await readFile(new URL(relative,root),'utf8'));assert.equal($('html').attr('lang'),lang);assert.equal($('h1').length,1);assert.equal($('link[rel=alternate][hreflang]').length,4);for(const target of ['en','el','ru'])assert.equal($(`.languages a[hreflang=${target}]`).attr('href'),`${base}/${target}/${p.key==='home'?'':p.key+'/'}`);assert.equal($('.languages a[aria-current]').length,1);if(!['home','contact','links'].includes(p.key)){const plain=s=>s.replace(/\s+/g,' ').trim();assert.equal(plain($('.prose').text()),plain(p.text));}}
});
test('SEO metadata and structured data are localized and complete',async()=>{
 for(const lang of ['en','el','ru']){
  const $=load(await readFile(new URL(`${lang}/index.html`,root),'utf8'));
  assert.ok($('title').text().length>30);
  assert.ok($('meta[name="description"]').attr('content').length>100);
  assert.equal($('meta[name="robots"]').attr('content'),'index,follow,max-image-preview:large');
  assert.equal($('meta[name="keywords"]').length,0);
  const data=JSON.parse($('script[type="application/ld+json"]').html());
  assert.equal(data[0]['@type'],'LegalService');
  assert.equal(data[1]['@type'],'WebSite');
  assert.equal(data[1].inLanguage,lang);
 }
 const sitemap=await readFile(new URL('../dist/sitemap.xml',import.meta.url),'utf8');
 assert.match(sitemap,/xmlns:xhtml="http:\/\/www\.w3\.org\/1999\/xhtml"/);
 assert.equal((sitemap.match(/<url>/g)||[]).length,8);
 assert.equal((sitemap.match(/hreflang="x-default"/g)||[]).length,8);
});
test('internal links and local assets resolve throughout generated output',async()=>{
 for await(const path of walk(root)){if(!path.endsWith('.html'))continue;const $=load(await readFile(path,'utf8'));for(const el of $('[href],[src]').toArray()){const link=$(el).attr('href')||$(el).attr('src');if(!link?.startsWith('/')||link.startsWith('//'))continue;assert.ok(!base||link.startsWith(base+'/'),`missing base: ${link}`);const local=link.slice(base.length).split(/[?#]/)[0].slice(1);const target=local.endsWith('/')?local+'index.html':local;await access(new URL(target,root));}assert.equal($('img[src^="http:"],script[src^="http:"],iframe[src^="http:"]').length,0);}
});
test('contact page uses a direct email link without embedding backend credentials',async()=>{
 const $=load(await readFile(new URL('en/contact/index.html',root),'utf8'));assert.equal($('form').length,0);assert.equal($('.contact-form').length,1);assert.equal($('.contact-form a[href="mailto:info@theodoroskaragiannis.com"]').length,1);
 assert.equal($('input[name=name]').length,0);assert.equal($('textarea').length,0);assert.equal($('.map-panel iframe').length,0);
});
test('the secondary mobile number is shown only on the Russian pages',async()=>{
 const ru=load(await readFile(new URL('ru/contact/index.html',root),'utf8'));
 const en=load(await readFile(new URL('en/contact/index.html',root),'utf8'));
 const el=load(await readFile(new URL('el/contact/index.html',root),'utf8'));
 assert.equal(ru('.contact-details a[href="tel:+306984334768"]').length,1);
 assert.equal(ru('.contact-details a.whatsapp-link[href="https://wa.me/306984334768"] svg').length,1);
 assert.equal(ru('.contact-details a.whatsapp-link').attr('aria-label'),'WhatsApp +30 698 433 4768');
 assert.equal(ru('.contact-details a[href^="tel:"]').first().attr('href'),'tel:+306984334768');
 assert.equal(ru('.contact-details a[href^="tel:"]').last().attr('href'),'tel:+302317003910');
 assert.equal(en('.contact-details a[href="tel:+302317003910"]').length,1);
 assert.equal(el('.contact-details a[href="tel:+302317003910"]').length,1);
 assert.equal(en('.contact-details a[href="tel:+306984334768"]').length,0);
 assert.equal(el('.contact-details a[href="tel:+306984334768"]').length,0);
 assert.equal(en('.contact-details a.whatsapp-link').length,0);
 assert.equal(el('.contact-details a.whatsapp-link').length,0);
 assert.equal(ru('.utility-phones a[aria-label^="WhatsApp"]').length,0);
 assert.equal(ru('.utility-phones a').first().attr('href'),'tel:+306984334768');
 assert.equal(ru('.utility-phones a').last().attr('href'),'tel:+302317003910');
 assert.equal(en('.utility-phones a[href="tel:+306984334768"]').length,0);
 assert.equal(el('.utility-phones a[href="tel:+306984334768"]').length,0);
});
