'use strict';
// Dependency-free verification of the real sharing module. No social messages
// are sent. The QR is decoded independently from its rendered SVG modules.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../src/share.js'), 'utf8');
const CANONICAL = 'https://junglyhh.github.io/flush_hour/';
let count = 0;
const tick = () => new Promise(resolve => setImmediate(resolve));
async function check(name, fn) { await fn(); count++; console.log(`  PASS ${name}`); }
function load(environment = {}) {
  const context = vm.createContext(environment);
  vm.runInContext(source, context, {filename:'src/share.js'});
  return {api:vm.runInContext('FlushSharing',context),context};
}

// Test only the DOM surface the component uses; there is no implementation of
// its copy/share state machine in this harness. Native-dialog integration and
// appearance are verified separately in the actual browser by the app owner.
class Element {
  constructor(tag, doc) {this.tagName=tag.toUpperCase();this.doc=doc;this.attrs={};this.children=[];this.listeners={};this.hidden=false;this.disabled=false;this.open=false;this.isConnected=false;this.textContent='';this.parentElement=null;this.scrollTop=0;}
  appendChild(child) {child.parentElement=this;child.isConnected=true;this.children.push(child);return child;}
  setAttribute(name,value) {this.attrs[name]=String(value);if(name==='id')this.id=String(value);}
  getAttribute(name) {return this.attrs[name]??null;}
  hasAttribute(name) {return Object.hasOwn(this.attrs,name);}
  addEventListener(type,fn) {(this.listeners[type]??=[]).push(fn);}
  dispatch(type,event={}) {
    event.type=type;event.target??=this;event.preventDefault??=()=>{event.defaultPrevented=true;};event.stopPropagation??=()=>{event.propagationStopped=true;};
    for(const fn of this.listeners[type]||[])fn(event);return event;
  }
  matches(selector) {
    if(selector.startsWith('#'))return this.id===selector.slice(1);
    const attr=selector.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);
    return Boolean(attr&&this.hasAttribute(attr[1])&&(attr[2]===undefined||this.getAttribute(attr[1])===attr[2]));
  }
  closest(selector) {return this.matches(selector)?this:this.parentElement?.closest(selector)??null;}
  querySelector(selector) {return this.children.find(n=>n.matches(selector))||this.children.map(n=>n.querySelector(selector)).find(Boolean)||null;}
  querySelectorAll(selector) {return this.children.flatMap(n=>[...(n.matches(selector)?[n]:[]),...n.querySelectorAll(selector)]);}
  set innerHTML(value) {
    for(const child of this.children)child.isConnected=false;
    this._html=value;this.children=[];
    for(const m of value.matchAll(/<(button|input|a|section|p|h2|h3|label)\b([^>]*)>/g)){
      const node=new Element(m[1],this.doc);
      for(const attr of m[2].matchAll(/([\w-]+)(?:="([^"]*)")?/g))node.setAttribute(attr[1],(attr[2]??'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'"));
      node.hidden=node.hasAttribute('hidden');node.value=node.getAttribute('value')??'';this.appendChild(node);
    }
  }
  get innerHTML(){return this._html||'';}
  focus(){this.doc.activeElement=this;this.focused=true;}
  select(){this.selected=true;}
  setSelectionRange(a,b){this.selectionStart=a;this.selectionEnd=b;}
  scrollIntoView(){this.scrolledIntoView=true;}
  getBoundingClientRect(){return {left:25,right:535,top:25,bottom:650};}
  showModal(){assert.equal(this.open,false);this.open=true;this.showModalCalls=(this.showModalCalls||0)+1;}
  close(){if(!this.open)return;this.open=false;queueMicrotask(()=>this.dispatch('close'));}
}
function harness(options={}) {
  const doc={created:[],execCalls:[],activeElement:null};
  doc.createElement=tag=>{const e=new Element(tag,doc);doc.created.push(e);return e;};
  doc.head=new Element('head',doc);doc.body=new Element('body',doc);doc.head.isConnected=doc.body.isConnected=true;
  doc.execCommand=command=>{doc.execCalls.push(command);return options.execResult??false;};
  const opener=new Element('button',doc);opener.isConnected=true;opener.id='shareBtn';doc.activeElement=opener;
  const navigator=options.navigator??{};
  const {api}=load({document:doc,navigator,window:{isSecureContext:options.secure??true}});
  const dialog=()=>doc.created.find(e=>e.tagName==='DIALOG');
  const action=name=>dialog()?.querySelector(`[data-fh-share-action="${name}"]`);
  const click=name=>{const node=action(name);assert.ok(node,`missing action: ${name}`);return dialog().dispatch('click',{target:node});};
  const status=()=>dialog().querySelector('#fhShareStatus').textContent;
  return {api,doc,opener,dialog,action,click,status,navigator};
}

// Decode QR version 4 directly from SVG coordinates, without sharing the
// generator's code or reading QR_ROWS. Format BCH, masking, zig-zag codeword
// extraction, block deinterleaving and Reed-Solomon syndromes are checked.
function decodeQr(svg) {
  assert.match(svg,/viewBox="0 0 41 41"/);
  const size=33;
  const matrix=Array.from({length:size},()=>Array(size).fill(false));
  const modules=[...svg.matchAll(/M(\d+) (\d+)h1v1h-1z/g)];
  assert.ok(modules.length>400,'QR has substantial encoded artwork');
  for(const [,xs,ys] of modules){const x=Number(xs)-4,y=Number(ys)-4;assert.ok(x>=0&&x<size&&y>=0&&y<size,'four-module quiet zone is intact');assert.equal(matrix[y][x],false,'no duplicate module');matrix[y][x]=true;}
  for(const [oy,ox] of [[0,0],[0,26],[26,0]])for(let r=0;r<7;r++)for(let c=0;c<7;c++){
    const expected=r===0||r===6||c===0||c===6||(r>=2&&r<=4&&c>=2&&c<=4);
    assert.equal(matrix[oy+r][ox+c],expected,'finder pattern');
  }
  function formatCode(data){let rem=data<<10;for(let i=14;i>=10;i--)if((rem>>i)&1)rem^=0x537<<(i-10);return ((data<<10)|rem)^0x5412;}
  let format=0;
  for(let i=0;i<15;i++){const r=i<6?i:i<8?i+1:size-15+i;if(matrix[r][8])format|=1<<i;}
  const formatData=Array.from({length:32},(_,i)=>i).find(i=>formatCode(i)===format);
  assert.notEqual(formatData,undefined,'valid BCH-protected format information');
  assert.equal(formatData>>3,0,'error correction level M');
  const maskId=formatData&7;
  const reserved=Array.from({length:size},()=>Array(size).fill(false));
  const reserve=(r0,c0,r1,c1)=>{for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++)reserved[r][c]=true;};
  reserve(0,0,8,8);reserve(0,25,8,32);reserve(25,0,32,8);
  reserve(24,24,28,28);reserve(6,0,6,32);reserve(0,6,32,6);
  const masks=[(r,c)=>(r+c)%2===0,r=>r%2===0,(r,c)=>c%3===0,(r,c)=>(r+c)%3===0,(r,c)=>(Math.floor(r/2)+Math.floor(c/3))%2===0,(r,c)=>(r*c)%2+(r*c)%3===0,(r,c)=>((r*c)%2+(r*c)%3)%2===0,(r,c)=>((r*c)%3+(r+c)%2)%2===0];
  let upward=true;const bits=[];
  for(let right=32;right>=1;right-=2){if(right===6)right--;for(let i=0;i<size;i++){const r=upward?size-1-i:i;for(let side=0;side<2;side++){const c=right-side;if(!reserved[r][c])bits.push(Number(matrix[r][c]!==masks[maskId](r,c)));}}upward=!upward;}
  assert.equal(bits.length,807,'version 4 has 100 codewords plus 7 remainder bits');
  assert.ok(bits.slice(800).every(bit=>bit===0),'remainder bits');
  const words=Array.from({length:100},(_,i)=>bits.slice(i*8,i*8+8).reduce((v,b)=>(v<<1)|b,0));
  const blocks=[[],[]];
  for(let i=0;i<32;i++)for(let b=0;b<2;b++)blocks[b].push(words[i*2+b]);
  for(let i=0;i<18;i++)for(let b=0;b<2;b++)blocks[b].push(words[64+i*2+b]);
  function multiply(a,b){let out=0;while(b){if(b&1)out^=a;a<<=1;if(a&256)a^=0x11d;b>>=1;}return out;}
  for(const block of blocks){let alpha=1;for(let power=0;power<18;power++){const syndrome=block.reduce((v,word)=>multiply(v,alpha)^word,0);assert.equal(syndrome,0,`RS parity syndrome ${power}`);alpha=multiply(alpha,2);}}
  const data=blocks[0].slice(0,32).concat(blocks[1].slice(0,32));
  let bitIndex=0;
  const read=n=>{let v=0;for(let i=0;i<n;i++,bitIndex++)v=(v<<1)|((data[bitIndex>>3]>>(7-(bitIndex%8)))&1);return v;};
  assert.equal(read(4),4,'byte encoding');const length=read(8);const payload=Buffer.from(Array.from({length},()=>read(8))).toString('utf8');
  assert.equal(read(4),0,'proper data terminator');
  return {payload,version:4,ecc:'M',mask:maskId,modules:modules.length};
}

(async()=>{
  await check('module initializes without document, navigator, location, URL or network',()=>{
    const {api}=load();assert.equal(api.canonicalUrl,CANONICAL);assert.equal(api.isOpen(),false);assert.doesNotThrow(()=>api.close());
    assert.equal(Object.isFrozen(api),true);
  });
  await check('all provider URLs preserve the canonical URL and localized text',()=>{
    const {api}=load();
    for(const lang of ['en','zh','zh-CN']){
      const links=api.getLinks(lang),data=api.getShareData(lang);
      assert.equal(data.url,CANONICAL);assert.ok(data.text.length>20);assert.ok(data.title.includes('Flush Hour'));
      assert.deepEqual(Object.keys(links).sort(),['facebook','linkedin','telegram','whatsapp','x']);
      const expected={facebook:['www.facebook.com','/sharer/sharer.php'],x:['x.com','/intent/tweet'],whatsapp:['wa.me','/'],telegram:['t.me','/share/url'],linkedin:['www.linkedin.com','/sharing/share-offsite/']};
      for(const [provider,href] of Object.entries(links)){
        const url=new URL(href);assert.equal(url.protocol,'https:');assert.equal(url.hostname,expected[provider][0]);assert.equal(url.pathname,expected[provider][1]);assert.equal(url.username,'');assert.equal(url.password,'');
        if(provider==='whatsapp')assert.equal(url.searchParams.get('text'),data.text+' '+CANONICAL);
        else assert.equal(url.searchParams.get(provider==='facebook'?'u':'url'),CANONICAL);
        if(['x','telegram'].includes(provider))assert.equal(url.searchParams.get('text'),data.text);
      }
    }
    assert.match(api.getShareData('en').text,/\b30\b/);
    assert.match(api.getShareData('zh').text,/三十/);
    assert.match(api.getShareData('zh').text,/冲冲大作战/);assert.notEqual(api.getShareData('zh').text,api.getShareData('en').text);
    assert.equal(api.getShareData('unsupported').text,api.getShareData('en').text);
  });
  await check('offline SVG QR independently decodes to the game with valid error correction',()=>{
    const {api}=load();const qr=decodeQr(api.qrSvg('en'));assert.equal(qr.payload,CANONICAL);
    assert.equal(decodeQr(api.qrSvg('zh')).payload,CANONICAL);
    assert.doesNotMatch(api.qrSvg('en'),/<(?:script|image|foreignObject)\b|\son\w+=|(?:xlink:)?href=/i);
    assert.match(api.qrSvg('zh'),/aria-label="冲冲大作战游戏二维码"/);
    console.log(`    QR: version ${qr.version}, ECC ${qr.ecc}, mask ${qr.mask}, ${qr.modules} dark modules; both RS blocks valid.`);
  });
  await check('open is lazy, singleton, labelled and focuses a close control',()=>{
    const h=harness();assert.equal(h.doc.created.length,0);h.api.open('en');
    assert.equal(h.doc.created.filter(e=>e.tagName==='STYLE').length,1);assert.equal(h.doc.created.filter(e=>e.tagName==='DIALOG').length,1);
    assert.equal(h.api.isOpen(),true);assert.equal(h.dialog().getAttribute('aria-labelledby'),'fhShareTitle');assert.equal(h.dialog().getAttribute('aria-describedby'),'fhShareIntro');
    assert.equal(h.doc.activeElement,h.action('close'));assert.equal(h.dialog().lang,'en');
    h.api.open('zh');assert.equal(h.doc.created.length,2);assert.equal(h.dialog().lang,'zh-CN');assert.equal(h.dialog().showModalCalls,1);
    assert.match(h.dialog().innerHTML,/选择分享方式/);assert.equal(h.action('native'),null);
    assert.equal(h.dialog().querySelector('#fhShareLink').value,CANONICAL);
    const live=h.dialog().querySelector('#fhShareStatus');assert.equal(live.getAttribute('role'),'status');assert.equal(live.getAttribute('aria-live'),'polite');
    assert.doesNotMatch(h.dialog().innerHTML,/\bdata-(?:action|level|edge)=/,'must not trigger game delegated handlers');
  });
  await check('external handoffs are labelled safe new-tab links with no executable URLs',()=>{
    const h=harness();h.api.open();const links=h.dialog().querySelectorAll('[data-fh-share-external]');assert.equal(links.length,5);
    for(const link of links){assert.equal(link.getAttribute('target'),'_blank');assert.equal(link.getAttribute('rel'),'noopener noreferrer');assert.equal(link.getAttribute('referrerpolicy'),'no-referrer');assert.match(link.getAttribute('aria-label'),/opens a new tab/);assert.match(link.getAttribute('href'),/^https:\/\//);}
    const event=h.dialog().dispatch('click',{target:links[0]});assert.notEqual(event.defaultPrevented,true,'normal browser navigation remains enabled');assert.match(h.status(),/choose the recipient or audience/);
  });
  await check('WeChat expands an accessible offline QR and describes the in-app step honestly',()=>{
    const h=harness();h.api.open('zh');const panel=h.dialog().querySelector('#fhShareWechat');assert.equal(panel.hidden,true);
    h.click('wechat');assert.equal(panel.hidden,false);assert.equal(h.action('wechat').getAttribute('aria-expanded'),'true');assert.match(h.status(),/二维码/);assert.equal(panel.scrolledIntoView,true);
    assert.match(h.dialog().innerHTML,/另一台设备/);assert.match(h.dialog().innerHTML,/需要在微信中完成/);
    h.click('wechat');assert.equal(panel.hidden,true);assert.equal(h.action('wechat').getAttribute('aria-expanded'),'false');assert.equal(h.status(),'');
  });
  await check('Escape, native cancel and backdrop close restore focus without host shortcuts',async()=>{
    for(const method of ['escape','cancel','backdrop','button','api']){
      const h=harness();h.api.open();
      if(method==='escape'){const event=h.dialog().dispatch('keydown',{key:'Escape'});assert.equal(event.defaultPrevented,true);assert.equal(event.propagationStopped,true);}
      else if(method==='cancel'){const event=h.dialog().dispatch('cancel');assert.equal(event.defaultPrevented,true);}
      else if(method==='backdrop')h.dialog().dispatch('click',{target:h.dialog(),clientX:0,clientY:0});
      else if(method==='button')h.click('close');else h.api.close();
      assert.equal(h.api.isOpen(),false);await tick();assert.equal(h.doc.activeElement,h.opener);
    }
    const h=harness();h.api.open();const event=h.dialog().dispatch('keydown',{key:'r'});assert.equal(event.propagationStopped,true);assert.equal(h.api.isOpen(),true);
    h.dialog().dispatch('click',{target:h.dialog(),clientX:100,clientY:100});assert.equal(h.api.isOpen(),true,'padding clicks do not close');
  });
  await check('copy uses clipboard first and never shares the local file path',async()=>{
    const calls=[];const h=harness({navigator:{clipboard:{writeText:async text=>{calls.push(text);}}}});h.api.open();h.click('copy');await tick();
    assert.deepEqual(calls,[CANONICAL]);assert.match(h.status(),/^Link copied/);assert.deepEqual(h.doc.execCalls,[]);
  });
  await check('clipboard denial falls back to selected-link copy, then manual instructions',async()=>{
    for(const execResult of [true,false]){
      const h=harness({execResult,navigator:{clipboard:{writeText:async()=>{throw new Error('Denied');}}}});h.api.open('zh');h.click('copy');await tick();
      assert.deepEqual(h.doc.execCalls,['copy']);const input=h.dialog().querySelector('#fhShareLink');assert.equal(input.selected,true);assert.equal(input.selectionStart,0);assert.equal(input.selectionEnd,CANONICAL.length);
      assert.match(h.status(),execResult?/链接已复制/:/请选中并复制/);assert.equal(h.doc.activeElement,execResult?h.action('copy'):input);
    }
    const h=harness();h.api.open();h.click('copy');await tick();assert.match(h.status(),/Select and copy/);
  });
  await check('native share is invoked synchronously by click and resists duplicate submission',async()=>{
    const calls=[];let resolve;const promise=new Promise(r=>{resolve=r;});const h=harness({navigator:{share:data=>{calls.push(data);return promise;},canShare:()=>true}});h.api.open();h.click('native');
    assert.equal(calls.length,1,'native call occurs before click returns');assert.equal(calls[0].url,CANONICAL);assert.equal(h.action('native').disabled,true);
    h.click('native');assert.equal(calls.length,1);resolve();await tick();assert.equal(h.action('native').disabled,false);assert.match(h.status(),/handled the share request/);assert.doesNotMatch(h.status(),/sent|posted|delivered/i);
  });
  await check('native cancellation and denial show useful localized statuses',async()=>{
    for(const name of ['AbortError','NotAllowedError']){
      const h=harness({navigator:{share:async()=>{const e=new Error('provider result');e.name=name;throw e;}}});h.api.open('zh');h.click('native');await tick();
      assert.equal(h.action('native').disabled,false);assert.match(h.status(),name==='AbortError'?/已取消分享/:/无法打开系统分享/);
    }
  });
  await check('native option hides when capability, payload policy or secure context is missing',()=>{
    for(const options of [{},{secure:false,navigator:{share:()=>{}}},{navigator:{share:()=>{},canShare:()=>false}},{navigator:{share:()=>{},canShare:()=>{throw Error('policy');}}}]){
      const h=harness(options);h.api.open();assert.equal(h.action('native'),null);assert.ok(h.action('copy'));assert.ok(h.action('wechat'));
    }
  });
  await check('late copy/share completions cannot overwrite a newly opened dialog',async()=>{
    for(const operation of ['copy','native']){
      let resolve;const pending=new Promise(r=>{resolve=r;});const navigator=operation==='copy'?{clipboard:{writeText:()=>pending}}:{share:()=>pending};
      const h=harness({navigator});h.api.open('en');h.click(operation);h.api.close();h.api.open('zh');await tick();
      assert.equal(h.api.isOpen(),true);assert.equal(h.doc.activeElement,h.action('close'),'queued close event must not steal focus');
      resolve();await tick();assert.equal(h.status(),'');assert.equal(h.dialog().lang,'zh-CN');
      h.api.close();await tick();assert.ok(h.doc.activeElement===h.opener,'reopened dialog still returns to the original opener');
    }
  });
  console.log(`\nSharing QA passed: ${count} checks; static QR decodes correctly in both languages. No messages were sent.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
