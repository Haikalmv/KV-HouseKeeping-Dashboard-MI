/* Villa board offline support. Change the version when you upload new files. */
const VERSION='villa-board-v2';
const LOCAL=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
const PDF='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
const EXTRA=[PDF+'pdf.min.js',PDF+'pdf.worker.min.js'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(VERSION).then(async c=>{
    await c.addAll(LOCAL);
    /* the PDF reader is saved too when online, so importing works offline; skipped quietly if it fails */
    await Promise.all(EXTRA.map(u=>fetch(u,{mode:'cors'}).then(r=>r.ok&&c.put(u,r)).catch(()=>{})));
  }));
  self.skipWaiting();
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  const url=new URL(req.url);
  const same=url.origin===location.origin;
  const keep=same||/^(fonts\.googleapis\.com|fonts\.gstatic\.com|cdnjs\.cloudflare\.com)$/.test(url.hostname);
  if(!keep)return;
  e.respondWith(caches.open(VERSION).then(async c=>{
    const hit=await c.match(req,{ignoreSearch:same})||(req.mode==='navigate'?await c.match('./index.html'):null);
    const net=fetch(req).then(r=>{if(r&&(r.ok||r.type==='opaque'))c.put(req,r.clone());return r}).catch(()=>null);
    if(hit){if(same)e.waitUntil(net);return hit}  /* open instantly from the phone, refresh in the background */
    return (await net)||new Response('Offline',{status:503,statusText:'Offline'});
  }));
});
