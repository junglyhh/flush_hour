'use strict';
/* This is a deterministic DOM substitute, not a browser or screenshot test.
 * It executes the application script embedded in index.html, with a test-only
 * closure export. No source-template reconstruction is used.
 * It tests state and event flows; it cannot validate CSS layout or animation.
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const reportDir = path.join(root, '.qa-output');
fs.mkdirSync(reportDir, {recursive:true});
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const embeddedLevelMatch = html.match(/<script id="level-data" type="application\/json">([\s\S]*?)<\/script>/);
assert.ok(embeddedLevelMatch, 'built HTML has embedded level data');
const embeddedLevelData = embeddedLevelMatch[1];
const levels = JSON.parse(embeddedLevelData);
const sourceLevels = JSON.parse(fs.readFileSync(path.join(root, 'data', 'levels.json'), 'utf8'));
const certificates = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'verification.json'), 'utf8')).levels;
const KEY = 'flush-hour:campaign:v2';
const LEGACY_KEY = 'flush-hour:twin:testing:v1';
let assertions = 0;
function eq(a,b,m) { assertions++; assert.deepEqual(a,b,m); }
function check(a,m) { assertions++; assert.ok(a,m); }
eq(levels,sourceLevels,'built HTML embeds the current level definitions');
eq(levels.length,30,'actual application contains all thirty campaign levels');
check(!html.includes('sequenceEdgeIndices'),'solution certificates stay out of the playable HTML');
check(!html.includes('globalThis.FHQA'),'test-only closure exports stay out of the playable HTML');
check(!/all (?:ten|10) (?:rooms|levels)|all (?:rooms|levels) (?:are )?open|全部(?:十|10)关|所有关卡(?:均|都)?已开放|testing edition/i.test(html),'player copy no longer advertises the ten-room all-open test edition');
const copy = x => JSON.parse(JSON.stringify(x));
function decode(s) { return String(s).replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&'); }

class Node {
  constructor(tag, doc) { this.tagName=tag.toLowerCase(); this.doc=doc; this.attributes={}; this.children=[]; this.parentNode=null; this.listeners={}; this.style={setProperty(name,value){this[name]=value;}}; this._text=''; this._html=''; this.disabled=false; this.hidden=false; this.open=false; this.clientWidth=760; }
  get id(){return this.attributes.id||'';} set id(v){this.setAttribute('id',v);}
  get parentElement(){return this.parentNode;}
  get className(){return this.attributes.class||'';} set className(v){this.setAttribute('class',v);}
  get classList(){const self=this;const tokens=()=>new Set(self.className.split(/\s+/).filter(Boolean));return {add(...names){const a=tokens();names.forEach(n=>a.add(n));self.className=[...a].join(' ');},remove(...names){const a=tokens();names.forEach(n=>a.delete(n));self.className=[...a].join(' ');},contains(name){return tokens().has(name);},toggle(name,force){const a=tokens(),on=force===undefined?!a.has(name):!!force;if(on)a.add(name);else a.delete(name);self.className=[...a].join(' ');return on;}};}
  get dataset(){const out={};for(const[k,v]of Object.entries(this.attributes))if(k.startsWith('data-'))out[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=v;return out;}
  setAttribute(name,value){this.attributes[name]=String(value);if(name==='id')this.doc.ids.set(String(value),this);if(name==='disabled')this.disabled=true;if(name==='hidden')this.hidden=true;}
  getAttribute(name){return this.attributes[name]??null;}
  removeAttribute(name){delete this.attributes[name];}
  clear(){for(const c of this.children)c.remove();this.children=[];this._text='';}
  remove(){for(const c of [...this.children])c.remove();if(this.id&&this.doc.ids.get(this.id)===this)this.doc.ids.delete(this.id);if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(n=>n!==this);this.parentNode=null;}
  appendChild(child){child.parentNode=this;this.children.push(child);return child;}
  get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}
  set textContent(value){this.clear();this._text=String(value);this._html=String(value);}
  get innerHTML(){return this._html;}
  set innerHTML(value){this.clear();this._html=String(value);const stack=[this];let last=0;const re=/<\/?[a-zA-Z][^>]*>/g;let match;while((match=re.exec(this._html))){stack.at(-1)._text+=decode(this._html.slice(last,match.index));last=re.lastIndex;const token=match[0],name=token.match(/^<\/?([^\s/>]+)/)[1].toLowerCase();if(token.startsWith('</')){for(let i=stack.length-1;i>0;i--)if(stack[i].tagName===name){stack.length=i;break;}continue;}const element=new Node(name,this.doc);const attrText=token.slice(1+name.length,-1);const attr=/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;let a;while((a=attr.exec(attrText)))element.setAttribute(a[1],decode(a[2]??a[3]??a[4]??''));stack.at(-1).appendChild(element);if(!token.endsWith('/>')&&!['input','meta','link','br','hr','img','source','wbr','area','embed'].includes(name))stack.push(element);}stack.at(-1)._text+=decode(this._html.slice(last));}
  matches(selector){return selector.split(',').some(raw=>{const s=raw.trim();if(s.startsWith('.'))return this.classList.contains(s.slice(1));if(s.startsWith('#'))return this.id===s.slice(1);const attr=s.match(/^\[([^=\]]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\]]*)))?\]$/);if(attr){const value=attr[2]??attr[3]??attr[4];return Object.hasOwn(this.attributes,attr[1])&&(value===undefined||this.attributes[attr[1]]===value);}return this.tagName===s.toLowerCase();});}
  querySelectorAll(selector){const out=[];const walk=n=>{for(const c of n.children){if(c.matches(selector))out.push(c);walk(c);}};walk(this);return out;}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
  closest(selector){for(let n=this;n;n=n.parentNode)if(n.matches(selector))return n;return null;}
  addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
  dispatch(type,extra={}){const event={type,target:this,preventDefault(){this.defaultPrevented=true;},stopPropagation(){this.propagationStopped=true;},...extra};for(let n=this;n;n=n.parentNode){for(const fn of n.listeners[type]||[])fn(event);if(event.propagationStopped)return event;}for(const fn of this.doc.listeners[type]||[])fn(event);return event;}
  click(){if(!this.disabled)this.dispatch('click');}
  focus(options={}){this.doc.activeElement=this;this.doc.viewEvents.push({type:'focus',id:this.id,preventScroll:options.preventScroll===true});}
  scrollIntoView(){}
  showModal(){this.open=true;}
  close(){this.open=false;for(const fn of this.listeners.close||[])fn({target:this});}
  getBoundingClientRect(){return {left:0,right:520,top:0,bottom:600,width:520,height:600};}
}
class Document {
  constructor(){this.ids=new Map();this.listeners={};this.viewEvents=[];this.documentElement=new Node('html',this);this.head=this.documentElement.appendChild(new Node('head',this));this.body=this.documentElement.appendChild(new Node('body',this));this.title='';}
  getElementById(id){return this.ids.get(id)||null;}
  createElement(tag){return new Node(tag,this);}
  querySelectorAll(s){return this.documentElement.querySelectorAll(s);}
  querySelector(s){return this.documentElement.querySelector(s);}
  addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
}

function makeApp(storage=new Map(), options={}) {
  const document=new Document();
  document.body.innerHTML=html.match(/<body\b[^>]*>([\s\S]*?)<script id="level-data"/)[1];
  const levelData=document.body.appendChild(document.createElement('script'));levelData.id='level-data';levelData.textContent=options.levels?JSON.stringify(options.levels):embeddedLevelData;
  let clock=0,nextTimer=1;const timers=new Map(),frames=[];
  const sandbox={document,window:{},console,URL,URLSearchParams,Blob,TextEncoder,navigator:{},location:new URL(options.url||'https://junglyhh.github.io/flush_hour/'),ResizeObserver:class{observe(){}},matchMedia:()=>({matches:options.reducedMotion===true,addEventListener(){}}),performance:{now:()=>clock},localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>{if(options.blockStorage)throw Error('Storage blocked');storage.set(key,value);}},setTimeout(fn,delay){const id=nextTimer++;timers.set(id,{at:clock+(delay||0),fn});return id;},clearTimeout(id){timers.delete(id);},requestAnimationFrame(fn){frames.push(fn);return frames.length;}};
  sandbox.scrollX=0;sandbox.scrollY=0;
  sandbox.scrollTo=(first,second)=>{const target=typeof first==='object'?first:{left:first,top:second};sandbox.scrollX=target.left??sandbox.scrollX;sandbox.scrollY=target.top??sandbox.scrollY;document.viewEvents.push({type:'scroll',left:sandbox.scrollX,top:sandbox.scrollY,behavior:target.behavior});};
  sandbox.window=sandbox;
  let script=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].filter(match=>!match[1].includes('application/json')).map(match=>match[2]).join('\n');
  const exportCode=`globalThis.FHQA={move,undo,restart,flush,loadLevel,closeModal,openVictory,openFailure,openGuide,openPicker,validSavedSession,isUnlocked,unlockedThrough,counts,sharing:FlushSharing,getSnapshot:()=>JSON.parse(JSON.stringify({current,state,records,language,sound,storageAvailable,modalKind,hintStep}))};\nloadLevel(current,true);`;
  check(script.includes('loadLevel(current,true);'),'initialization hook exists');
  script=script.replace('loadLevel(current,true);',exportCode);
  const context=vm.createContext(sandbox);vm.runInContext(script,context,{filename:'flush-hour-test-only.js'});
  const api=sandbox.FHQA;
  function tick(now){clock=now;for(const frame of frames.splice(0))frame(clock);for(const[id,timer]of [...timers])if(timer.at<=clock){timers.delete(id);timer.fn();}}
  function snap(){return copy(api.getSnapshot());}
  function click(selector){const target=document.querySelector(selector);check(target,`click target ${selector}`);target.click();}
  return {api,document,storage,tick,snap,click,get now(){return clock;},pendingFrames:()=>frames.length,viewEvents:document.viewEvents,scrollPosition:()=>({left:sandbox.scrollX,top:sandbox.scrollY}),setScrollPosition(top,left=0){sandbox.scrollY=top;sandbox.scrollX=left;}};
}


// Fixed legacy mechanics are independent of the production migration manifest.
// In particular, a reused room ID is not evidence that the puzzle is unchanged.
const LEGACY = [{"id":"flush-01","shape":"pair","nodes":[{"id":"A","x":0,"y":0.5},{"id":"B","x":1,"y":0.5}],"edges":[[0,1]],"initial":[80,20],"threshold":55,"moveLimit":3,"optimalMoves":1},{"id":"flush-02","shape":"path3","nodes":[{"id":"A","x":0,"y":0},{"id":"B","x":1,"y":0.5},{"id":"C","x":0,"y":1}],"edges":[[0,1],[1,2]],"initial":[90,0,0],"threshold":40,"moveLimit":5,"optimalMoves":3},{"id":"flush-03","shape":"triangle","nodes":[{"id":"A","x":0,"y":0},{"id":"B","x":1,"y":0},{"id":"C","x":0.5,"y":1}],"edges":[[0,1],[1,2],[2,0]],"initial":[90,70,0],"threshold":55,"moveLimit":6,"optimalMoves":4},{"id":"flush-04","shape":"star","nodes":[{"id":"A","x":0.5,"y":0.5},{"id":"B","x":0,"y":0},{"id":"C","x":1,"y":0},{"id":"D","x":0.5,"y":1}],"edges":[[0,1],[0,2],[0,3]],"initial":[0,90,60,10],"threshold":44,"moveLimit":8,"optimalMoves":5},{"id":"flush-05","shape":"cycle5","nodes":[{"id":"A","x":0.5,"y":0},{"id":"B","x":1,"y":0.5},{"id":"C","x":1,"y":1},{"id":"D","x":0,"y":1},{"id":"E","x":0,"y":0.5}],"edges":[[0,1],[1,2],[2,3],[3,4],[4,0]],"initial":[35,35,0,5,95],"threshold":35,"moveLimit":10,"optimalMoves":5},{"id":"flush-06","shape":"kite","nodes":[{"id":"A","x":0,"y":0.5},{"id":"B","x":0.5,"y":0},{"id":"C","x":0.45,"y":1},{"id":"D","x":1,"y":0.5},{"id":"E","x":1,"y":1}],"edges":[[0,1],[0,2],[1,3],[2,3],[3,4]],"initial":[100,35,75,75,5],"threshold":60,"moveLimit":11,"optimalMoves":8},{"id":"flush-07","shape":"double_t","nodes":[{"id":"A","x":0,"y":0},{"id":"B","x":0,"y":0.5},{"id":"C","x":0,"y":1},{"id":"D","x":1,"y":0},{"id":"E","x":1,"y":0.5},{"id":"F","x":1,"y":1}],"edges":[[0,1],[1,2],[1,4],[3,4],[4,5]],"initial":[85,25,10,45,85,75],"threshold":56,"moveLimit":13,"optimalMoves":10},{"id":"flush-08","shape":"bull","nodes":[{"id":"A","x":0,"y":0.5},{"id":"B","x":1,"y":0.5},{"id":"C","x":0.5,"y":1},{"id":"D","x":0,"y":0},{"id":"E","x":1,"y":0}],"edges":[[0,1],[1,2],[2,0],[0,3],[1,4]],"initial":[60,25,55,80,25],"threshold":50,"moveLimit":15,"optimalMoves":12},{"id":"flush-09","shape":"path5","nodes":[{"id":"A","x":0,"y":0},{"id":"B","x":1,"y":0},{"id":"C","x":1,"y":0.5},{"id":"D","x":0,"y":0.5},{"id":"E","x":0,"y":1}],"edges":[[0,1],[1,2],[2,3],[3,4]],"initial":[65,85,25,25,15],"threshold":48,"moveLimit":14,"optimalMoves":14},{"id":"flush-10","shape":"lollipop","nodes":[{"id":"A","x":0,"y":0},{"id":"B","x":1,"y":0},{"id":"C","x":0.5,"y":0.5},{"id":"D","x":1,"y":1},{"id":"E","x":0,"y":1}],"edges":[[0,1],[1,2],[2,0],[2,3],[3,4]],"initial":[10,40,40,65,80],"threshold":48,"moveLimit":16,"optimalMoves":16}];
const signature = level => JSON.stringify([level.initial,level.edges,level.threshold,level.moveLimit]);
const puzzleIdentity = level => JSON.stringify([level.initial,level.edges,level.threshold]);
const certificateFor = level => {
  const certificate=certificates.find(item=>item.id===level.id);
  check(certificate,'every actual level has an ID-matched solution fixture');
  return certificate;
};
const recordFor = (level,best=level.optimalMoves,flushed=false) => ({cleared:true,best,flushed,signature:signature(level)});
function savedGame(custom=levels, options={}) {
  const index=options.current??0,level=custom[Math.min(Math.max(0,index),custom.length-1)];
  return {version:2,language:'en',sound:false,records:{},current:index,session:{level:level.id,values:level.initial.slice(),moves:0,history:[],phase:'playing'},...options};
}
function restoreSave(save, custom=levels) {
  return makeApp(new Map([[KEY,JSON.stringify(save)]]),{levels:custom});
}
function testLevel(mechanics) {
  return {...copy(levels[0]),...copy(mechanics)};
}
function withFirst(mechanics) {
  const custom=copy(levels);
  custom[0]=testLevel({...mechanics,id:custom[0].id});
  return custom;
}
function pair(limit=3,threshold=55) {
  return {shape:'pair',nodes:[{id:'A',x:0,y:.5},{id:'B',x:1,y:.5}],edges:[[0,1]],initial:[80,20],threshold,optimalMoves:1,moveLimit:limit};
}
function triangle(initial=[51,50,49],limit=16) {
  return {shape:'triangle',nodes:[{id:'A',x:0,y:0},{id:'B',x:1,y:0},{id:'C',x:.5,y:1}],edges:[[0,1],[1,2],[2,0]],initial,threshold:50,optimalMoves:1,moveLimit:limit};
}
function coreSnapshot(app) {
  const {current,state,records}=app.snap();return {current,state,records};
}
function assertAccess(app,through,where='sidebar') {
  eq(app.api.unlockedThrough(),through,'highest reachable room follows the contiguous cleared prefix');
  const container=where==='picker'?app.document.getElementById('modal'):app.document.getElementById('levelList');
  const buttons=container.querySelectorAll('[data-level]');
  eq(buttons.length,levels.length,where+' displays every room');
  buttons.forEach((button,index)=>{
    eq(Number(button.dataset.level),index,where+' room order matches campaign');
    eq(app.api.isUnlocked(index),index<=through,where+' access predicate');
    eq(button.disabled,index>through,where+' locked controls are disabled');
    if(index>through)eq(button.getAttribute('aria-disabled'),'true',where+' communicates locked status accessibly');
  });
}
function clearActual(app,index) {
  for(const edgeIndex of certificateFor(levels[index]).sequenceEdgeIndices)app.api.move(edgeIndex);
}

// Fresh progression must resist sidebar, picker, direct call and URL selection.
const locked=makeApp();
assertAccess(locked,0);
const lockedStart=coreSnapshot(locked);
for(const index of [1,10,29,-1,30,1.5,NaN,Infinity,'1',null,undefined]) {
  eq(locked.api.isUnlocked(index),false,'invalid or future room is locked');
  eq(locked.api.loadLevel(index),false,'invalid or locked direct load refuses');
  eq(coreSnapshot(locked),lockedStart,'refused direct load does not reset or change the current puzzle');
}
locked.document.getElementById('levelList').querySelector('[data-level="1"]').click();
eq(coreSnapshot(locked),lockedStart,'disabled sidebar room cannot be selected');
locked.document.getElementById('levelList').querySelector('[data-level="29"]').dispatch('click');
eq(coreSnapshot(locked),lockedStart,'event handler also guards a forced click on a disabled room');
locked.api.openPicker();
assertAccess(locked,0,'picker');
locked.document.getElementById('modal').querySelector('[data-level="29"]').dispatch('click');
eq(coreSnapshot(locked),lockedStart,'picker event cannot bypass the campaign gate');
locked.api.closeModal();
const queryBypass=makeApp(new Map(),{url:'https://junglyhh.github.io/flush_hour/?level=30&unlocked=30#level=30'});
eq(queryBypass.snap().current,0,'a URL cannot select a locked room');
eq(queryBypass.api.unlockedThrough(),0,'a URL cannot award progression');

// A real clear unlocks the next room before its optional celebration flush.
const pairLevels=withFirst(pair());
const earned=makeApp(new Map(),{levels:pairLevels});
earned.api.move(0);
eq(earned.snap().state.phase,'won','fixture clears through actual move handler');
eq(earned.api.unlockedThrough(),1,'winning immediately unlocks the next room');
eq(earned.snap().records[pairLevels[0].id],recordFor(pairLevels[0]),'clear is certified with the current puzzle signature');
eq(earned.api.counts().c,1,'campaign counts actual clears');
eq(earned.api.counts().f,0,'winning does not fabricate a completed flush');
eq(earned.document.getElementById('levelList').querySelector('[data-level="1"]').disabled,false,'sidebar enables the next room before flushing');
earned.api.openPicker();
eq(earned.document.getElementById('modal').querySelector('[data-level="1"]').disabled,false,'picker enables the next room before flushing');
eq(earned.api.loadLevel(1),true,'next room can be entered before flushing');
eq(earned.snap().current,1,'next room actually becomes current');
earned.api.loadLevel(0);earned.api.move(0);earned.api.undo();
eq(earned.snap().state.phase,'playing','undo can leave an unflushed won board');
eq(earned.api.unlockedThrough(),1,'undo never revokes an earned unlock');
earned.api.restart();
eq(earned.api.unlockedThrough(),1,'restart never revokes an earned unlock');
const earnedReload=makeApp(new Map(earned.storage),{levels:pairLevels});
eq(earnedReload.api.unlockedThrough(),1,'earned access survives refresh after undo and restart');
eq(earnedReload.api.loadLevel(2),false,'a clear unlocks only the next unearned room');
eq(earnedReload.api.loadLevel(1),true,'earned access remains usable after refresh');

// The completed-board Next control must reach the absolute page top after
// the newly loaded heading has received focus. Per-toilet status remains
// accessible even though the visible status captions have been removed.
const nextFlow=makeApp(new Map(),{levels:pairLevels});
eq(nextFlow.document.querySelectorAll('.waste-state').length,0,'toilets do not render separate visible status captions');
check(nextFlow.document.getElementById('toilet-0').getAttribute('aria-label').includes('above the limit'),'unsafe toilet retains its accessible English status');
check(nextFlow.document.getElementById('toilet-1').getAttribute('aria-label').includes('at or below the limit'),'ready toilet retains its accessible English status');
nextFlow.click('#languageBtn');
check(nextFlow.document.getElementById('toilet-0').getAttribute('aria-label').includes('超过上限'),'unsafe toilet retains its accessible Chinese status');
check(nextFlow.document.getElementById('toilet-1').getAttribute('aria-label').includes('不超过上限'),'ready toilet retains its accessible Chinese status');
nextFlow.click('#languageBtn');nextFlow.api.move(0);
check(nextFlow.document.getElementById('toilet-0').classList.contains('ready'),'cleared percentage badge has the ready state');
check(nextFlow.document.getElementById('toilet-0').getAttribute('aria-label').includes('at or below the limit'),'averaging updates the accessible status');
nextFlow.api.flush();nextFlow.tick(5000);
check(nextFlow.document.getElementById('toilet-0').getAttribute('aria-label').includes('0%'),'flushed toilet announces zero waste');
check(nextFlow.document.getElementById('toilet-0').getAttribute('aria-label').includes('Fresh'),'flushed toilet retains its accessible completion status');
nextFlow.setScrollPosition(900);
const nextEventsStart=nextFlow.viewEvents.length;
nextFlow.click('[data-action="next"]');nextFlow.tick(nextFlow.now+16);
eq(nextFlow.snap().current,1,'actual Next control advances to the unlocked room');
eq(nextFlow.snap().state.values,pairLevels[1].initial,'Next loads the next initial board');
eq(nextFlow.scrollPosition().top,0,'Next reaches the absolute page top');
eq(nextFlow.document.activeElement.id,'levelTitle','Next gives keyboard focus to the new room heading');
const nextEvents=nextFlow.viewEvents.slice(nextEventsStart);
const lastScroll=nextEvents.findLastIndex(event=>event.type==='scroll');
check(lastScroll>=0,'Next explicitly scrolls the page after advancing');
check(nextEvents.slice(lastScroll+1).every(event=>event.type!=='focus'||event.preventScroll),'later focus cannot undo the top-of-page scroll');
eq(nextFlow.document.querySelectorAll('.waste-state').length,0,'changing rooms does not recreate status captions');

// Production moves, win dialog, inspection, numerical drain and saving for all
// thirty certified solutions. Navigation proceeds through earned unlocks.
const allApp=makeApp();
const allResults=[];
for(let index=0;index<levels.length;index++) {
  eq(allApp.api.loadLevel(index),true,'sequential room selection is earned');
  const start=allApp.snap();
  eq(start.current,index,'correct campaign room selected');
  eq(start.state.values,levels[index].initial,'fresh initial board');
  const beforeLanguage=copy(start.state),beforeRecords=copy(start.records),beforeAccess=allApp.api.unlockedThrough();
  allApp.click('#languageBtn');eq(allApp.snap().language,'zh','language toggles to Chinese');eq(allApp.snap().state,beforeLanguage,'Chinese switch preserves puzzle');
  eq(allApp.snap().records,beforeRecords,'Chinese switch preserves records');eq(allApp.api.unlockedThrough(),beforeAccess,'Chinese switch preserves access');
  allApp.click('#languageBtn');eq(allApp.snap().language,'en','language toggles to English');eq(allApp.snap().state,beforeLanguage,'English switch preserves puzzle');
  clearActual(allApp,index);
  const won=allApp.snap();
  eq(won.state.phase,'won','solution triggers actual won phase');
  eq(won.state.moves,levels[index].optimalMoves,'solution uses verified optimum');
  eq(won.records[levels[index].id],recordFor(levels[index]),'win records the exact puzzle clear before any flush');
  eq(allApp.api.unlockedThrough(),Math.min(index+1,levels.length-1),'next room is unlocked on the winning move');
  eq(allApp.api.counts().c,index+1,'cleared count advances immediately');
  eq(allApp.api.counts().f,index,'cleared and flushed counts remain distinct before celebration');
  eq(allApp.api.counts().g,index+1,'perfect count uses the verified optimum');
  check(allApp.document.getElementById('progressSegments').children[index].classList.contains('done'),'progress indicator marks an actual clear before flushing');
  if(index<levels.length-1)eq(allApp.document.getElementById('levelList').querySelector('[data-level="'+(index+1)+'"]').disabled,false,'rendered next-room control becomes usable on clear');
  check(allApp.document.getElementById('modal').open,'victory pop-up opens');
  eq(won.modalKind,'victory','congratulation dialog kind');
  check(allApp.document.querySelector('[data-action="flush"]'),'congratulation has flush button');
  allApp.click('[data-action="close"]');
  eq(allApp.document.getElementById('modal').open,false,'inspect closes popup');
  eq(allApp.snap().state,won.state,'inspect leaves solved board untouched');
  check(allApp.document.querySelector('[data-action="flush"]'),'inspect keeps on-board flush control');
  const clearedReload=makeApp(new Map(allApp.storage));
  eq(clearedReload.snap().state,won.state,'cleared state restores before flushing');
  eq(clearedReload.api.unlockedThrough(),Math.min(index+1,levels.length-1),'unflushed earned unlock survives reload');
  clearedReload.tick(200);eq(clearedReload.snap().modalKind,'victory','restored clear offers flush popup');
  allApp.click('[data-action="flush"]');
  eq(allApp.snap().state.phase,'flushing','flush control begins animation state');
  eq(allApp.snap().state.values,won.state.values,'logical values held until earned flush completes');
  eq(JSON.parse(allApp.storage.get(KEY)).session.phase,'won','mid-flush save safely restores an earned flush');
  const during=allApp.snap();
  allApp.api.move(0);allApp.api.undo();allApp.api.restart();allApp.api.loadLevel((index+1)%levels.length);
  eq(allApp.snap().state,during.state,'gameplay transitions blocked during flush');
  eq(allApp.snap().current,index,'navigation blocked during flush');
  check(allApp.document.getElementById('shareBtn').disabled,'sharing control is disabled during flush');
  const midReload=makeApp(new Map(allApp.storage));
  eq(midReload.snap().state.phase,'won','interrupted flush reload returns to earned celebration');
  eq(midReload.snap().state.values,won.state.values,'interrupted flush does not lose or fabricate waste');
  const startTime=allApp.now;
  allApp.tick(startTime+1000);
  eq(allApp.snap().state.phase,'flushing','animation persists through mid-frame');
  const displayed=levels[index].nodes.map((_,i)=>Number(allApp.document.getElementById('waste-'+i).textContent));
  check(displayed.some((value,i)=>value>0&&value<won.state.values[i]),'intermediate frame numerically lowers at least one percentage');
  allApp.tick(startTime+5000);
  const fresh=allApp.snap();
  eq(fresh.state.phase,'flushed','animation completes');
  eq(fresh.state.values,levels[index].initial.map(()=>0),'all logical waste becomes exactly zero');
  eq(fresh.state.moves,won.state.moves,'celebration costs no moves');
  eq(fresh.state.history,[],'cannot undo an earned flush');
  check(fresh.records[levels[index].id].flushed,'flushed completion persisted');
  for(let i=0;i<levels[index].nodes.length;i++)eq(allApp.document.getElementById('waste-'+i).textContent,'0','rendered label becomes zero');
  allApp.api.undo();eq(allApp.snap().state,fresh.state,'undo after flush cannot resurrect waste');
  const freshReload=makeApp(new Map(allApp.storage));
  eq(freshReload.snap().state,fresh.state,'flushed state survives reload');
  eq(freshReload.api.unlockedThrough(),Math.min(index+1,levels.length-1),'flush reload preserves access');
  allResults.push({id:levels[index].id,solution:'pass',unlockBeforeFlush:'pass',inspection:'pass',flush:'pass',reload:'pass'});
}
eq(Object.values(allApp.snap().records).filter(record=>record.cleared).length,30,'all thirty clear records saved independently');
eq(Object.values(allApp.snap().records).filter(record=>record.flushed).length,30,'all thirty flush records saved independently');
eq(copy(allApp.api.counts()),{c:30,f:30,g:30},'complete campaign reports thirty clears, flushes and perfect scores');
assertAccess(allApp,29);
allApp.tick(allApp.now+600);
eq(allApp.snap().modalKind,'tour','final flush celebrates the full campaign');
allApp.api.closeModal();allApp.setScrollPosition(600);
const lastRoomEvents=allApp.viewEvents.length;
allApp.click('[data-action="next"]');
eq(allApp.snap().current,29,'last-room control does not advance past the campaign');
eq(allApp.snap().modalKind,'picker','last-room control still opens the room picker');
eq(allApp.viewEvents.slice(lastRoomEvents).filter(event=>event.type==='scroll').length,0,'opening the final room picker does not trigger the next-room page scroll');
allApp.api.closeModal();

// At the move cap, an equal pair is free. A tiny but positive excess still
// fails, and the failure remains undoable before and after refresh.
const detourCap=Math.min(40,Math.max(16,...levels.map(level=>level.moveLimit)));
const tinyLevels=withFirst(triangle([51,50,49],detourCap));
const failure=makeApp(new Map(),{levels:tinyLevels});
for(let i=0;i<detourCap-1;i++)failure.api.move(i%2);
eq(failure.snap().state.phase,'playing','inefficient path is active just before the cap');
eq(failure.snap().state.moves,detourCap-1,'every unequal averaging move counted');
const nearLimit=failure.snap().state;
failure.api.move((detourCap-2)%2);
eq(failure.snap().state,nearLimit,'no-op on the last available move costs nothing');
eq(failure.api.unlockedThrough(),0,'a no-op does not unlock another room');
failure.api.move((detourCap-1)%2);
const failed=failure.snap().state;
eq(failed.phase,'failed','unfinished board fails at exact cap');
eq(failed.moves,detourCap,'cap is enforced');
check(failure.document.getElementById('modal').open,'failure dialog opens');
eq(failure.api.unlockedThrough(),0,'failure does not unlock the next room');
const maxIndex=failed.values.indexOf(Math.max(...failed.values));
check(failed.values[maxIndex]>50&&failed.values[maxIndex]<50.0001,'reachable excess is tiny but positive');
check(failure.document.getElementById('toilet-'+maxIndex).classList.contains('too-full'),'tiny excess retains unsafe styling');
check(Number(failure.document.getElementById('waste-'+maxIndex).textContent)>50,'label does not hide positive excess');
failure.api.move(0);failure.api.move(2);eq(failure.snap().state,failed,'no additional edge move after failure');
const failureReload=makeApp(new Map(failure.storage),{levels:tinyLevels});
eq(failureReload.snap().state,failed,'failed board survives reload');
failureReload.api.undo();eq(failureReload.snap().state,nearLimit,'undo after restored failure resumes the exact prior state');
failure.click('[data-action="undo"]');eq(failure.snap().state,nearLimit,'failure dialog undo restores prior state');
eq(failure.document.getElementById('modal').open,false,'undo dismisses failure');
failure.api.undo();eq(failure.snap().state.moves,detourCap-2,'ordinary undo works');
failure.api.restart();eq(failure.snap().state.values,tinyLevels[0].initial,'restart restores initial data');
eq(failure.snap().state.moves,0,'restart resets moves');eq(failure.snap().state.history,[],'restart clears history');

// Keyboard activation routes through the real SVG listener exactly once.
const keyboard=makeApp(new Map(),{levels:pairLevels});
keyboard.document.querySelector('[data-edge="0"]').dispatch('keydown',{key:'Enter'});
eq(keyboard.snap().state.moves,1,'Enter activates a pipe exactly once');
eq(keyboard.snap().state.phase,'won','keyboard can clear a room');
keyboard.api.undo();eq(keyboard.snap().state.moves,0,'undo can leave victory before flushing');
eq(keyboard.api.unlockedThrough(),1,'keyboard-earned unlock survives undo');
keyboard.document.querySelector('[data-edge="0"]').dispatch('keydown',{key:' '});
eq(keyboard.snap().state.moves,1,'Space activates a pipe exactly once');

// Reduced motion and unavailable storage still allow a real earned zero state.
const reduced=makeApp(new Map(),{levels:pairLevels,reducedMotion:true});
reduced.api.move(0);reduced.api.flush();reduced.tick(500);
eq(reduced.snap().state.phase,'flushed','reduced motion completes flush');
eq(reduced.snap().state.values,[0,0],'reduced motion drains every bowl');
const malformed=makeApp(new Map([[KEY,'{broken']]));
eq(malformed.snap().state.values,levels[0].initial,'corrupt JSON safely starts clean');
eq(malformed.api.unlockedThrough(),0,'corrupt save grants no rooms');
const blocked=makeApp(new Map(),{levels:pairLevels,blockStorage:true});
blocked.api.move(0);eq(blocked.snap().state.phase,'won','blocked storage does not break gameplay');
eq(blocked.snap().storageAvailable,false,'storage limitation is detected');
eq(blocked.api.unlockedThrough(),1,'blocked storage still allows session progress');

// Equality counts in initial ready styling, count, actual win, and final move.
const readyLevels=withFirst(triangle([50,70,30],1));
const initialEquality=makeApp(new Map(),{levels:readyLevels});
check(initialEquality.document.getElementById('toilet-0').classList.contains('ready'),'threshold-equal toilet is ready immediately');
check(!initialEquality.document.getElementById('toilet-0').classList.contains('too-full'),'equality is not too full');
check(initialEquality.document.getElementById('readyValue').innerHTML.startsWith('2 '),'ready count includes equality');
initialEquality.click('#languageBtn');
check(initialEquality.document.getElementById('toilet-0').classList.contains('ready'),'Chinese switch preserves equality styling');
initialEquality.api.move(1);
eq(initialEquality.snap().state.values,[50,50,50],'averaging can put every node exactly on threshold');
eq(initialEquality.snap().state.phase,'won','all equal to threshold wins on the final allowed move');
eq(initialEquality.snap().modalKind,'victory','inclusive boundary opens victory dialog');
eq(initialEquality.api.unlockedThrough(),1,'an equality win earns the next room');

for(const oldPhase of ['playing','failed']) {
  const custom=withFirst(pair(oldPhase==='playing'?3:1,50));
  const previous={ [custom[0].id]:recordFor(custom[0],oldPhase==='playing'?2:1,true), [custom[1].id]:recordFor(custom[1]) };
  const save=savedGame(custom,{language:'zh',sound:true,records:previous,session:{level:custom[0].id,values:[50,50],moves:1,history:[[80,20]],phase:oldPhase}});
  const restored=restoreSave(save,custom);
  eq(restored.snap().state.phase,'won','a stale saved phase is recomputed with inclusive rules');
  eq(restored.snap().state.moves,1,'inclusive restoration preserves moves');
  eq(restored.snap().state.values,[50,50],'inclusive restoration preserves waste');
  eq(restored.snap().records[custom[0].id],recordFor(custom[0],1,true),'restored clear updates best and retains earned flush');
  eq(restored.snap().records[custom[1].id],previous[custom[1].id],'restored clear retains another earned record');
  eq(restored.api.unlockedThrough(),2,'restored clear retains the contiguous unlock prefix');
  restored.tick(200);eq(restored.snap().modalKind,'victory','restored inclusive winner receives celebration');
  eq(JSON.parse(restored.storage.get(KEY)).session.phase,'won','corrected phase is saved');
}
const newEqualityLevels=withFirst(pair(1,50));
const missingClear=savedGame(newEqualityLevels,{session:{level:newEqualityLevels[0].id,values:[50,50],moves:1,history:[[80,20]],phase:'failed'}});
const newClear=restoreSave(missingClear,newEqualityLevels);
eq(newClear.snap().records[newEqualityLevels[0].id],recordFor(newEqualityLevels[0]),'restored valid equality win creates a missing record');
eq(newClear.api.unlockedThrough(),1,'restored new clear unlocks the next room');

// New-format progress is tied to mechanics and valid earned scores. A future
// current index or an extra unlocked property is never an access credential.
for(const badRecord of [
  {...recordFor(levels[0]),cleared:false},
  {...recordFor(levels[0]),signature:'stale-puzzle'},
  {...recordFor(levels[0]),best:levels[0].optimalMoves-1},
  {...recordFor(levels[0]),best:levels[0].moveLimit+1},
  {...recordFor(levels[0]),best:1.5},
  {...recordFor(levels[0]),best:String(levels[0].optimalMoves)},
  {best:levels[0].optimalMoves,flushed:true},
]) {
  const app=restoreSave(savedGame(levels,{records:{[levels[0].id]:badRecord},current:29,unlockedThrough:29,session:null}));
  eq(app.api.unlockedThrough(),0,'invalid clear cannot unlock a future room');
  eq(app.snap().current,0,'locked saved selection is clamped to earned access');
  eq(app.snap().records,{},'invalid progress record is removed');
}
const gapRecords={[levels[0].id]:recordFor(levels[0]),[levels[2].id]:recordFor(levels[2])};
const gap=restoreSave(savedGame(levels,{records:gapRecords,current:29,session:null}));
eq(gap.api.unlockedThrough(),1,'a hole in current-format clears stops the unlock prefix');
eq(gap.snap().current,1,'unreachable saved room clamps to highest earned room');
eq(gap.api.loadLevel(2),false,'an out-of-prefix record cannot bypass a missing preceding clear');

// A saved session must replay actual unequal pipe moves from the initial
// puzzle; equal total waste alone is insufficient to certify a clear.
const invalidSessions=[
  {values:[55,45],moves:1,history:[[80,20]],phase:'won'},
  {values:[50,50],moves:1,history:[[75,25]],phase:'won'},
  {values:[50,50],moves:2,history:[[80,20],[60,40]],phase:'won'},
  {values:[50,50],moves:2,history:[[80,20],[50,50]],phase:'won'},
  {values:[0,0],moves:1,history:[],phase:'flushed'},
  {values:[50,50],moves:1.5,history:[[80,20]],phase:'won'},
  {values:[50,50],moves:4,history:[[80,20]],phase:'won'},
  {values:[50,50],moves:1,history:null,phase:'won'},
  {values:[50],moves:1,history:[[80,20]],phase:'won'},
  {values:[null,100],moves:1,history:[[80,20]],phase:'won'},
  {level:'unrelated-room',values:[50,50],moves:1,history:[[80,20]],phase:'won'},
];
for(const candidate of invalidSessions) {
  const save=savedGame(pairLevels,{session:{level:pairLevels[0].id,...candidate}});
  const app=restoreSave(save,pairLevels);
  eq(app.snap().state,{values:[80,20],moves:0,history:[],phase:'playing'},'invalid session resets to the actual initial puzzle');
  eq(app.api.unlockedThrough(),0,'invalid session cannot certify an unlock');
  eq(app.snap().records,{},'invalid session cannot create a clear record');
}

// Legacy migration preserves every genuinely matching award. Access still
// follows the NEW ordered campaign's contiguous cleared prefix; a dormant
// later award cannot skip a newly inserted or uncleared puzzle.
function expectedLegacyRecords(custom,oldRecords) {
  const result={};
  for(const level of custom) {
    const old=LEGACY.find(candidate=>puzzleIdentity(candidate)===puzzleIdentity(level));
    const record=old&&oldRecords[old.id];
    if(!record||!Number.isInteger(record.best)||record.best<old.optimalMoves||record.best<level.optimalMoves||record.best>old.moveLimit||record.best>level.moveLimit)continue;
    result[level.id]=recordFor(level,record.best,record.flushed===true);
  }
  return result;
}
function expectedThrough(custom,records) {
  const firstMissing=custom.findIndex(level=>!records[level.id]);
  return firstMissing===-1?custom.length-1:Math.min(firstMissing,custom.length-1);
}
function legacySave(options={}) {
  return {version:1,language:'zh',sound:true,records:{},current:9,session:null,...options};
}
function restoreLegacy(save,custom=levels) {
  return makeApp(new Map([[LEGACY_KEY,JSON.stringify(save)]]),{levels:custom});
}
const allOldRecords=Object.fromEntries(LEGACY.map(level=>[level.id,{best:level.optimalMoves,flushed:true}]));
const actualLegacySave=legacySave({records:allOldRecords});
const actualMigration=restoreLegacy(actualLegacySave);
const actualExpected=expectedLegacyRecords(levels,allOldRecords);
eq(actualMigration.snap().records,actualExpected,'real legacy saves retain all exact-mechanics-matching earned awards');
eq(actualMigration.api.unlockedThrough(),expectedThrough(levels,actualExpected),'real migration grants only contiguous certified access');
eq(actualMigration.snap().language,'zh','migration preserves language');
eq(actualMigration.snap().sound,true,'migration preserves optional sound preference');
eq(actualMigration.storage.get(LEGACY_KEY),JSON.stringify(actualLegacySave),'migration leaves the legacy save intact');
eq(JSON.parse(actualMigration.storage.get(KEY)).version,2,'migration persists the new versioned format');
const noLegacyWins=restoreLegacy(legacySave());
eq(noLegacyWins.snap().current,0,'old all-open selection grants no free access');
eq(noLegacyWins.api.unlockedThrough(),0,'old all-open progress starts with only room one');

// Every old puzzle is checked independently at the new campaign's first
// position, so an early new room cannot conceal a mistake in later metadata.
for(let oldIndex=0;oldIndex<LEGACY.length;oldIndex++) {
  const old=LEGACY[oldIndex],custom=copy(levels).map((level,index)=>({...level,id:'qa-legacy-check-'+index}));
  custom[0]=testLevel({...old,id:'qa-relocated-legacy-'+oldIndex});
  custom[1]=testLevel({...pair(),id:'qa-signature-gap',initial:[81,19]});
  const records={[old.id]:{best:old.optimalMoves,flushed:true}};
  const session={level:old.id,values:old.initial.slice(),moves:0,history:[],phase:'playing'};
  const app=restoreLegacy(legacySave({records,current:oldIndex,session}),custom);
  eq(app.snap().records,expectedLegacyRecords(custom,records),'every legacy definition migrates by exact mechanics after relocation');
  eq(app.snap().records[custom[0].id],recordFor(custom[0],old.optimalMoves,true),'relocated first puzzle retains its earned best and flush');
  eq(app.api.unlockedThrough(),1,'a relocated legacy clear unlocks only its immediate successor');
  eq(app.snap().current,0,'legacy selection maps to relocated puzzle position');
  eq(app.snap().state.values,old.initial,'matching relocated replay session retains its board');
  const tooLow=restoreLegacy(legacySave({records:{[old.id]:{best:old.optimalMoves-1,flushed:true}},current:oldIndex}),custom);
  eq(tooLow.api.unlockedThrough(),0,'each legacy optimum rejects an impossibly low saved score');
}

function reorderedLegacyCampaign() {
  const custom=copy(levels).map((level,index)=>({...level,id:'qa-extra-'+index}));
  custom[0]=testLevel({...LEGACY[0],id:'flush-02'});
  custom[1]=testLevel({...LEGACY[1],id:'flush-01'});
  custom[2]=testLevel({...pair(),id:'qa-new-room',initial:[85,15]});
  custom[3]=testLevel({...LEGACY[2],id:'qa-legacy-triangle'});
  return custom;
}
const reordered=reorderedLegacyCampaign();
const firstOldRecord={'flush-01':{best:1,flushed:true}};
const firstOnly=restoreLegacy(legacySave({records:firstOldRecord,current:1}),reordered);
eq(firstOnly.snap().records,expectedLegacyRecords(reordered,firstOldRecord),'legacy clear follows matching mechanics despite deliberately swapped IDs');
eq(firstOnly.snap().records['flush-01'],undefined,'reusing an old ID cannot transfer its award to different mechanics');
eq(firstOnly.api.unlockedThrough(),1,'a reused ID cannot certify a different puzzle');
eq(firstOnly.snap().current,1,'old reachable selection maps by puzzle signature');
const reorderedAll=restoreLegacy(legacySave({records:allOldRecords,current:2}),reordered);
eq(reorderedAll.snap().records,expectedLegacyRecords(reordered,allOldRecords),'migration preserves matching later awards across an inserted puzzle');
eq(reorderedAll.snap().records[reordered[3].id],recordFor(reordered[3],LEGACY[2].optimalMoves,true),'a later genuinely earned clear remains stored');
eq(reorderedAll.api.unlockedThrough(),2,'only the first new unearned room becomes available');
eq(reorderedAll.snap().current,2,'old out-of-prefix selection clamps to the reachable boundary');
eq(reorderedAll.api.loadLevel(3),false,'a stored later award remains inaccessible before the new gap is cleared');
const dormantAward=copy(reorderedAll.snap().records[reordered[3].id]);
reorderedAll.api.move(0);
eq(reorderedAll.snap().state.phase,'won','newly inserted gap must be genuinely cleared');
const afterGap={...expectedLegacyRecords(reordered,allOldRecords),[reordered[2].id]:recordFor(reordered[2])};
eq(reorderedAll.api.unlockedThrough(),expectedThrough(reordered,afterGap),'clearing the gap activates the already-earned contiguous suffix');
check(reorderedAll.api.isUnlocked(3)&&reorderedAll.api.isUnlocked(4),'dormant clear opens its successor only after preceding gap is cleared');
eq(reorderedAll.snap().records[reordered[3].id],dormantAward,'unlocking a dormant award preserves its best and flush');
const oldGapRecords={'flush-01':{best:1,flushed:false},'flush-03':{best:4,flushed:true}};
const oldGap=restoreLegacy(legacySave({records:oldGapRecords,current:2}),reordered);
eq(oldGap.snap().records,expectedLegacyRecords(reordered,oldGapRecords),'noncontiguous legacy awards are retained without granting access');
eq(oldGap.api.unlockedThrough(),1,'legacy score gap blocks downstream unlocks');

for(const change of [
  level=>{level.initial=[90,10];},
  level=>{level.edges=[[1,0]];},
  level=>{level.threshold=54;}
]) {
  const changed=copy(reordered);change(changed[0]);
  const app=restoreLegacy(legacySave({records:allOldRecords}),changed);
  eq(app.api.unlockedThrough(),0,'changing puzzle identity rejects stale wins');
  eq(app.snap().records[changed[0].id],undefined,'unchanged ID cannot rescue a mismatched legacy puzzle');
  eq(app.snap().records,expectedLegacyRecords(changed,allOldRecords),'other genuinely matching legacy awards survive a changed first puzzle');
}
// A changed allowance does not erase an earned win that meets BOTH editions'
// budgets. Conversely, fitting only the old or only the new budget is not
// sufficient. The migrated v2 record uses the new complete signature.
for(const [newCap,oldBest,shouldImport] of [[3,3,true],[7,3,true],[3,4,false],[7,6,false]]) {
  const custom=withFirst({...LEGACY[1],moveLimit:newCap});
  const app=restoreLegacy(legacySave({records:{'flush-02':{best:oldBest,flushed:true}},current:1}),custom);
  if(shouldImport) {
    eq(app.snap().records[custom[0].id],recordFor(custom[0],oldBest,true),'budget-adjusted puzzle keeps a win valid under both allowances');
    check(app.api.isUnlocked(1),'a valid migrated win unlocks its successor under the new allowance');
  } else {
    eq(app.snap().records[custom[0].id],undefined,'a win exceeding either allowance does not migrate to that room');
    eq(app.api.unlockedThrough(),0,'invalid budget-adjusted award cannot unlock a room');
  }
}
const lowerCapLevels=withFirst({...LEGACY[1],moveLimit:3});
const lowerCapSession={level:'flush-02',values:[45,45,0],moves:1,history:[[90,0,0]],phase:'playing'};
const lowerCapResume=restoreLegacy(legacySave({records:{'flush-02':{best:3,flushed:true}},current:1,session:lowerCapSession}),lowerCapLevels);
eq(lowerCapResume.snap().state,{values:[45,45,0],moves:1,history:[[90,0,0]],phase:'playing'},'matching legacy session resumes within the new smaller cap');
const strictTriangle=withFirst({...LEGACY[2],moveLimit:4});
const slowTriangleSession={level:'flush-03',values:[55,55,50],moves:5,history:[[90,70,0],[80,80,0],[80,40,40],[60,60,40],[60,50,50]],phase:'won'};
const overBudgetLegacy=restoreLegacy(legacySave({records:{'flush-03':{best:5,flushed:true}},current:2,session:slowTriangleSession}),strictTriangle);
eq(overBudgetLegacy.snap().state,{values:LEGACY[2].initial,moves:0,history:[],phase:'playing'},'a real old winning session over the new budget is not restored');
eq(overBudgetLegacy.api.unlockedThrough(),0,'an old over-budget victory cannot grant a new unlock');
for(const best of [0,-1,1.5,4,'1',null]) {
  const app=restoreLegacy(legacySave({records:{'flush-01':{best,flushed:true}}}),reordered);
  eq(app.api.unlockedThrough(),0,'invalid legacy score grants no access');
  eq(app.snap().records,{},'invalid legacy score is not imported');
}
const reachableOldSession={level:'flush-02',values:[45,45,0],moves:1,history:[[90,0,0]],phase:'playing'};
const resumed=restoreLegacy(legacySave({records:{'flush-01':{best:1,flushed:true}},current:1,session:reachableOldSession}),reordered);
eq(resumed.snap().current,1,'reachable legacy in-progress puzzle maps to its new index');
eq(resumed.snap().state,{values:[45,45,0],moves:1,history:[[90,0,0]],phase:'playing'},'reachable legacy session replays and resumes exactly');
eq(JSON.parse(resumed.storage.get(KEY)).session.level,reordered[1].id,'migrated session stores the new puzzle ID');
const unreachable=restoreLegacy(legacySave({current:1,session:reachableOldSession}),reordered);
eq(unreachable.snap().current,0,'unearned legacy in-progress selection is not restored');
eq(unreachable.snap().state.values,reordered[0].initial,'unearned legacy session is discarded');
const freshV2=savedGame(levels,{language:'en',sound:false,session:null});
const preferV2=makeApp(new Map([[KEY,JSON.stringify(freshV2)],[LEGACY_KEY,JSON.stringify(actualLegacySave)]]));
eq(preferV2.api.unlockedThrough(),0,'an existing v2 campaign is not replaced by older test-edition progress');
eq(preferV2.snap().language,'en','v2 preferences take precedence over legacy preferences');

// Exercise the real shared header/dialog integration without contacting any
// social provider. Provider-specific links, QR and async fallbacks have their
// own suite; these checks cover interactions with the actual game state.
const sharingLevels=withFirst(LEGACY[1]);
const sharing=makeApp(new Map(),{levels:sharingLevels});
sharing.api.move(0);
const beforeShare=coreSnapshot(sharing);
sharing.document.getElementById('shareBtn').focus();
sharing.click('#shareBtn');
check(sharing.api.sharing.isOpen(),'header opens the actual share dialog');
eq(coreSnapshot(sharing),beforeShare,'opening sharing preserves puzzle and progress');
const shareDialog=sharing.document.getElementById('fhShareDialog');
check(shareDialog.open,'sharing uses an open dialog');
for(const key of ['u','r','h'])shareDialog.dispatch('keydown',{key});
eq(coreSnapshot(sharing),beforeShare,'share dialog suppresses host gameplay shortcuts');
eq(sharing.snap().hintStep,0,'sharing does not open a background hint');
check(/\b30\b/.test(sharing.api.sharing.getShareData('en').text),'English share text describes thirty puzzles');
check(/30|三十/.test(sharing.api.sharing.getShareData('zh').text),'Chinese share text describes thirty puzzles');
eq(sharing.api.sharing.getShareData('en').url,'https://junglyhh.github.io/flush_hour/','sharing uses the published game URL');
shareDialog.dispatch('keydown',{key:'Escape'});
eq(sharing.api.sharing.isOpen(),false,'Escape closes the share dialog');
eq(sharing.document.activeElement.id,'shareBtn','closing sharing returns focus to its opener');
sharing.document.getElementById('board').dispatch('keydown',{key:'r'});
eq(sharing.snap().state.moves,0,'host keyboard shortcuts resume after sharing closes');
sharing.click('#languageBtn');sharing.click('#shareBtn');
eq(sharing.document.getElementById('fhShareDialog').lang,'zh-CN','sharing follows the selected game language');
sharing.api.sharing.close();

const wonForShare=makeApp(new Map(),{levels:pairLevels});wonForShare.api.move(0);
const pendingVictory=makeApp(new Map(wonForShare.storage),{levels:pairLevels});
pendingVictory.click('#shareBtn');pendingVictory.tick(200);
check(pendingVictory.api.sharing.isOpen(),'restored winner keeps sharing open');
eq(pendingVictory.document.getElementById('modal').open,false,'pending victory timer does not cover sharing');
pendingVictory.api.sharing.close();
const pendingFinale=makeApp(new Map(allApp.storage));
pendingFinale.api.loadLevel(levels.length-1);clearActual(pendingFinale,levels.length-1);pendingFinale.api.flush();
pendingFinale.tick(5000);pendingFinale.click('#shareBtn');pendingFinale.tick(5600);
check(pendingFinale.api.sharing.isOpen(),'sharing remains open across the finale timer');
eq(pendingFinale.document.getElementById('modal').open,false,'pending finale timer does not cover sharing');
eq(pendingFinale.snap().state.phase,'flushed','sharing preserves the final completed board');
pendingFinale.api.sharing.close();

const report={
  result:'pass',comparison:'inclusive <=',
  testType:'Actual built application script in deterministic fake DOM; not a browser, CSS layout or animation-rendering test',
  assertions,levels:allResults,
  checks:[
    'all thirty ID-matched solutions win and persist',
    'fresh sidebar, picker, direct load and URL lock enforcement',
    'true clear unlocks before flush',
    'completed-board Next reaches absolute page top after heading focus',
    'visible toilet status captions removed while accessible status remains',
    'undo, restart and refresh preserve earned unlocks',
    'language changes preserve puzzle and progression',
    'win dialog, inspect, interrupted flush and exact-zero completion',
    'all gameplay and sharing blocked during flush',
    'full campaign finale',
    'no-op before cap, exact failure, undo and failure reload',
    'keyboard Enter and Space',
    'reduced motion, corrupt JSON and blocked storage',
    'inclusive equality styling, counts, last-move win and restore',
    'tiny positive excess remains visible and fails',
    'signature-bound v2 records and contiguous access',
    'saved sessions replay real unequal averages',
    'legacy mechanics matching despite reordered IDs',
    'legacy prefix gaps and inserted puzzles prevent free unlocks',
    'dormant matching legacy awards survive and activate only after preceding gaps are cleared',
    'legacy awards and sessions respect both old and changed new move caps',
    'legacy reachable session migration and preference retention',
    'legacy data remains intact; current-format save takes precedence',
    'actual share header/dialog preserves state and suppresses host shortcuts',
    'thirty-puzzle share copy and canonical link',
    'pending victory and finale timers do not cover sharing'
  ]
};
fs.writeFileSync(path.join(reportDir,'app-state-qa-results.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,levels:undefined},null,2));
