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
const KEY = 'flush-hour:twin:testing:v1';
let assertions = 0;
function eq(a,b,m) { assertions++; assert.deepEqual(a,b,m); }
function check(a,m) { assertions++; assert.ok(a,m); }
eq(levels,sourceLevels,'built HTML embeds the current level definitions');
const copy = x => JSON.parse(JSON.stringify(x));
function decode(s) { return String(s).replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&'); }

class Node {
  constructor(tag, doc) { this.tagName=tag.toLowerCase(); this.doc=doc; this.attributes={}; this.children=[]; this.parentNode=null; this.listeners={}; this.style={setProperty(name,value){this[name]=value;}}; this._text=''; this._html=''; this.disabled=false; this.hidden=false; this.open=false; this.clientWidth=760; }
  get id(){return this.attributes.id||'';} set id(v){this.setAttribute('id',v);}
  get parentElement(){return this.parentNode;}
  get className(){return this.attributes.class||'';} set className(v){this.setAttribute('class',v);}
  get classList(){const self=this;const tokens=()=>new Set(self.className.split(/\s+/).filter(Boolean));return {add(...names){const a=tokens();names.forEach(n=>a.add(n));self.className=[...a].join(' ');},remove(...names){const a=tokens();names.forEach(n=>a.delete(n));self.className=[...a].join(' ');},contains(name){return tokens().has(name);},toggle(name,force){const a=tokens(),on=force===undefined?!a.has(name):!!force;if(on)a.add(name);else a.delete(name);self.className=[...a].join(' ');return on;}};}
  get dataset(){const out={};for(const[k,v]of Object.entries(this.attributes))if(k.startsWith('data-'))out[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=v;return out;}
  setAttribute(name,value){this.attributes[name]=String(value);if(name==='id')this.doc.ids.set(String(value),this);if(name==='disabled')this.disabled=true;}
  getAttribute(name){return this.attributes[name]??null;}
  removeAttribute(name){delete this.attributes[name];}
  clear(){for(const c of this.children)c.remove();this.children=[];this._text='';}
  remove(){for(const c of [...this.children])c.remove();if(this.id&&this.doc.ids.get(this.id)===this)this.doc.ids.delete(this.id);if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(n=>n!==this);this.parentNode=null;}
  appendChild(child){child.parentNode=this;this.children.push(child);return child;}
  get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}
  set textContent(value){this.clear();this._text=String(value);this._html=String(value);}
  get innerHTML(){return this._html;}
  set innerHTML(value){this.clear();this._html=String(value);const stack=[this];let last=0;const re=/<\/?[a-zA-Z][^>]*>/g;let match;while((match=re.exec(this._html))){stack.at(-1)._text+=decode(this._html.slice(last,match.index));last=re.lastIndex;const token=match[0],name=token.match(/^<\/?([^\s/>]+)/)[1].toLowerCase();if(token.startsWith('</')){for(let i=stack.length-1;i>0;i--)if(stack[i].tagName===name){stack.length=i;break;}continue;}const element=new Node(name,this.doc);const attrText=token.slice(1+name.length,-1);const attr=/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;let a;while((a=attr.exec(attrText)))element.setAttribute(a[1],decode(a[2]??a[3]??a[4]??''));stack.at(-1).appendChild(element);if(!token.endsWith('/>')&&!['input','meta','link','br','hr','img','source','wbr','area','embed'].includes(name))stack.push(element);}stack.at(-1)._text+=decode(this._html.slice(last));}
  matches(selector){return selector.split(',').some(raw=>{const s=raw.trim();if(s.startsWith('.'))return this.classList.contains(s.slice(1));if(s.startsWith('#'))return this.id===s.slice(1);const attr=s.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);if(attr)return Object.hasOwn(this.attributes,attr[1])&&(attr[2]===undefined||this.attributes[attr[1]]===attr[2]);return this.tagName===s.toLowerCase();});}
  querySelectorAll(selector){const out=[];const walk=n=>{for(const c of n.children){if(c.matches(selector))out.push(c);walk(c);}};walk(this);return out;}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
  closest(selector){for(let n=this;n;n=n.parentNode)if(n.matches(selector))return n;return null;}
  addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
  dispatch(type,extra={}){const event={type,target:this,preventDefault(){this.defaultPrevented=true;},...extra};for(let n=this;n;n=n.parentNode)for(const fn of n.listeners[type]||[])fn(event);for(const fn of this.doc.listeners[type]||[])fn(event);return event;}
  click(){if(!this.disabled)this.dispatch('click');}
  focus(){this.doc.activeElement=this;}
  showModal(){this.open=true;}
  close(){this.open=false;for(const fn of this.listeners.close||[])fn({target:this});}
  getBoundingClientRect(){return {left:0,right:520,top:0,bottom:600,width:520,height:600};}
}
class Document {
  constructor(){this.ids=new Map();this.listeners={};this.documentElement=new Node('html',this);this.head=this.documentElement.appendChild(new Node('head',this));this.body=this.documentElement.appendChild(new Node('body',this));this.title='';}
  getElementById(id){return this.ids.get(id)||null;}
  createElement(tag){return new Node(tag,this);}
  querySelectorAll(s){return this.documentElement.querySelectorAll(s);}
  querySelector(s){return this.documentElement.querySelector(s);}
  addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
}

function makeApp(storage=new Map(), options={}) {
  const document=new Document();
  document.body.innerHTML=html.match(/<body>([\s\S]*?)<script id="level-data"/)[1];
  const levelData=document.body.appendChild(document.createElement('script'));levelData.id='level-data';levelData.textContent=options.levels?JSON.stringify(options.levels):embeddedLevelData;
  let clock=0,nextTimer=1;const timers=new Map(),frames=[];
  const sandbox={document,window:{},console,ResizeObserver:class{observe(){}},matchMedia:()=>({matches:options.reducedMotion===true}),performance:{now:()=>clock},localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>{if(options.blockStorage)throw Error('Storage blocked');storage.set(key,value);}},setTimeout(fn,delay){const id=nextTimer++;timers.set(id,{at:clock+(delay||0),fn});return id;},clearTimeout(id){timers.delete(id);},requestAnimationFrame(fn){frames.push(fn);return frames.length;}};
  sandbox.window=sandbox;
  let script=html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
  const exportCode=`globalThis.FHQA={move,undo,restart,flush,loadLevel,closeModal,openVictory,openFailure,openGuide,openPicker,validSavedSession,getSnapshot:()=>JSON.parse(JSON.stringify({current,state,records,language,sound,storageAvailable,modalKind,hintStep}))};\nloadLevel(current,true);`;
  check(script.includes('loadLevel(current,true);'),'initialization hook exists');
  script=script.replace('loadLevel(current,true);',exportCode);
  const context=vm.createContext(sandbox);vm.runInContext(script,context,{filename:'flush-hour-test-only.js'});
  const api=sandbox.FHQA;
  function tick(now){clock=now;for(const frame of frames.splice(0))frame(clock);for(const[id,timer]of [...timers])if(timer.at<=clock){timers.delete(id);timer.fn();}}
  function snap(){return copy(api.getSnapshot());}
  function click(selector){const target=document.querySelector(selector);check(target,`click target ${selector}`);target.click();}
  return {api,document,storage,tick,snap,click,get now(){return clock;},pendingFrames:()=>frames.length};
}

// Production functions, events and saving for every exact solution.
const allApp=makeApp();
const allResults=[];
for(let index=0;index<levels.length;index++) {
  allApp.api.loadLevel(index);
  let start=allApp.snap();eq(start.current,index,'direct testing-level selection');eq(start.state.values,levels[index].initial,'fresh initial board');
  const beforeLanguage=copy(start.state);
  allApp.click('#languageBtn');eq(allApp.snap().language,'zh','language toggles to Chinese');eq(allApp.snap().state,beforeLanguage,'Chinese switch preserves puzzle');
  allApp.click('#languageBtn');eq(allApp.snap().language,'en','language toggles to English');eq(allApp.snap().state,beforeLanguage,'English switch preserves puzzle');
  for(const edgeIndex of certificates[index].sequenceEdgeIndices)allApp.api.move(edgeIndex);
  const won=allApp.snap();eq(won.state.phase,'won','solution triggers actual won phase');eq(won.state.moves,levels[index].optimalMoves,'solution uses optimum');check(allApp.document.getElementById('modal').open,'victory pop-up opens');eq(won.modalKind,'victory','congratulation dialog kind');check(allApp.document.querySelector('[data-action="flush"]'),'congratulation has flush button');
  allApp.click('[data-action="close"]');eq(allApp.document.getElementById('modal').open,false,'inspect closes popup');eq(allApp.snap().state,won.state,'inspect leaves solved board untouched');check(allApp.document.querySelector('[data-action="flush"]'),'inspect keeps on-board flush control');
  const clearedStorage=new Map(allApp.storage);
  const clearedReload=makeApp(clearedStorage);eq(clearedReload.snap().state,won.state,'cleared state restores before flushing');clearedReload.tick(200);eq(clearedReload.snap().modalKind,'victory','restored clear offers flush popup');
  allApp.click('[data-action="flush"]');eq(allApp.snap().state.phase,'flushing','flush control begins animation state');eq(allApp.snap().state.values,won.state.values,'logical values held until earned flush completes');eq(JSON.parse(allApp.storage.get(KEY)).session.phase,'won','mid-flush save safely restores an earned flush');
  const during=allApp.snap();allApp.api.move(0);allApp.api.undo();allApp.api.restart();allApp.api.loadLevel((index+1)%10);eq(allApp.snap().state,during.state,'all gameplay transitions blocked during flush');eq(allApp.snap().current,index,'navigation blocked during flush');
  const midReload=makeApp(new Map(allApp.storage));eq(midReload.snap().state.phase,'won','interrupted flush reload returns to earned celebration');eq(midReload.snap().state.values,won.state.values,'interrupted flush does not lose or fabricate waste');
  const startTime=allApp.now;allApp.tick(startTime+1000);check(allApp.snap().state.phase==='flushing','animation persists through mid-frame');const displayed=levels[index].nodes.map((_,i)=>Number(allApp.document.getElementById('waste-'+i).textContent));check(displayed.some((v,i)=>v>0&&v<won.state.values[i]),'intermediate frame visibly lowers at least one percentage');
  allApp.tick(startTime+3000);const fresh=allApp.snap();eq(fresh.state.phase,'flushed','animation completes');eq(fresh.state.values,levels[index].initial.map(()=>0),'all logical waste becomes exactly zero');eq(fresh.state.moves,won.state.moves,'celebration costs no moves');eq(fresh.state.history,[],'cannot undo the earned flush');check(fresh.records[levels[index].id].flushed,'flushed completion persisted');for(let i=0;i<levels[index].nodes.length;i++)eq(allApp.document.getElementById('waste-'+i).textContent,'0','rendered gauge label becomes zero');
  allApp.api.undo();eq(allApp.snap().state,fresh.state,'undo after flush cannot resurrect waste');
  const freshReload=makeApp(new Map(allApp.storage));eq(freshReload.snap().state,fresh.state,'flushed state survives reload');
  allResults.push({id:levels[index].id,solution:'pass',inspection:'pass',flush:'pass',reload:'pass'});
}
eq(Object.values(allApp.snap().records).filter(r=>r.flushed).length,10,'all ten room records saved independently');allApp.tick(allApp.now+600);eq(allApp.snap().modalKind,'tour','final flush celebrates full campaign');

// At a near-limit state, an equal pair is free; failure remains undoable.
const failure=makeApp();failure.api.loadLevel(4);for(let i=0;i<9;i++)failure.api.move(i%2?2:1);
eq(failure.snap().state.phase,'playing','intentionally inefficient path still active before cap');eq(failure.snap().state.moves,9,'nine costly moves counted');const nearLimit=failure.snap().state;failure.api.move(1);eq(failure.snap().state,nearLimit,'no-op on last available move costs nothing');
failure.api.move(2);eq(failure.snap().state.phase,'failed','unfinished board fails at exact cap');eq(failure.snap().state.moves,10,'cap is enforced');check(failure.document.getElementById('modal').open,'failure dialog opens');const failed=failure.snap().state;failure.api.move(2);failure.api.move(4);eq(failure.snap().state,failed,'no additional edge move after failure');
const failureReload=makeApp(new Map(failure.storage));eq(failureReload.snap().state,failed,'failed board survives reload');failureReload.api.undo();eq(failureReload.snap().state.phase,'playing','undo after restored failure resumes play');eq(failureReload.snap().state.moves,9,'undo decrements move count');eq(failureReload.snap().state.values,nearLimit.values,'undo restores exact previous values');
failure.click('[data-action="undo"]');eq(failure.snap().state,nearLimit,'failure dialog undo restores prior state');eq(failure.document.getElementById('modal').open,false,'undo dismisses failure');failure.api.undo();eq(failure.snap().state.moves,8,'ordinary undo works');failure.api.restart();eq(failure.snap().state.values,levels[4].initial,'restart restores initial data');eq(failure.snap().state.moves,0,'restart resets move count');eq(failure.snap().state.history,[],'restart clears undo history');

// Keyboard edge events route through the real SVG listener exactly once.
const keyboard=makeApp();const edge=keyboard.document.querySelector('[data-edge="0"]');edge.dispatch('keydown',{key:'Enter'});eq(keyboard.snap().state.moves,1,'Enter activates pipe exactly once');eq(keyboard.snap().state.phase,'won','keyboard can clear a level');keyboard.api.undo();eq(keyboard.snap().state.moves,0,'undo can leave victory before flush');keyboard.document.querySelector('[data-edge="0"]').dispatch('keydown',{key:' '});eq(keyboard.snap().state.moves,1,'Space activates pipe exactly once');

// Fresh-file resilience and reduced motion still produce a real zero state.
const reduced=makeApp(new Map(),{reducedMotion:true});reduced.api.move(0);reduced.api.flush();reduced.tick(500);eq(reduced.snap().state.phase,'flushed','reduced motion completes flush');eq(reduced.snap().state.values,[0,0],'reduced motion drains every bowl');
const malformed=makeApp(new Map([[KEY,'{broken']]));eq(malformed.snap().state.values,levels[0].initial,'corrupt JSON safely starts a clean session');
const blocked=makeApp(new Map(),{blockStorage:true});blocked.api.move(0);eq(blocked.snap().state.phase,'won','blocked storage does not break gameplay');eq(blocked.snap().storageAvailable,false,'storage limitation detected');

// Equality in the real fifth level is ready immediately, with no averaging.
const initialEquality=makeApp();initialEquality.api.loadLevel(4);
for(const i of [0,1]) {
  eq(initialEquality.snap().state.values[i],levels[4].threshold,'production level starts at threshold');
  check(initialEquality.document.getElementById('toilet-'+i).classList.contains('ready'),'threshold-equal toilet uses ready styling');
  check(!initialEquality.document.getElementById('toilet-'+i).classList.contains('too-full'),'threshold-equal toilet is not too full');
}
check(initialEquality.document.getElementById('readyValue').innerHTML.startsWith('4 '),'ready count includes both equal-threshold toilets');
initialEquality.click('#languageBtn');
check(initialEquality.document.getElementById('toilet-0').classList.contains('ready'),'Chinese switch preserves equality-ready styling');

// Synthetic but valid test-only puzzles exercise exact boundary outcomes in
// the actual application. No production level data is changed.
function equalityPair(limit=1) {
  const custom=copy(levels);
  custom[0]={...custom[0],initial:[80,20],threshold:50,optimalMoves:1,moveLimit:limit};
  return custom;
}
const equalityWin=makeApp(new Map(),{levels:equalityPair()});
equalityWin.api.move(0);
eq(equalityWin.snap().state.values,[50,50],'averaging creates exact equality');
eq(equalityWin.snap().state.phase,'won','all vertices equal to threshold wins');
eq(equalityWin.snap().state.moves,1,'inclusive win on final allowed move');
eq(equalityWin.snap().modalKind,'victory','boundary equality opens actual victory dialog');

// Alternating two edges of this triangle approaches 50 from both sides.
// The unused third edge is a valid one-move solution, so the fixture is
// solvable; after 16 deliberate detours its maximum exceeds 50 by 1/32768.
const tinyLevels=copy(levels);
tinyLevels[0]={...copy(levels[2]),id:levels[0].id,initial:[51,50,49],threshold:50,optimalMoves:1,moveLimit:16};
const tinyExcess=makeApp(new Map(),{levels:tinyLevels});
for(let i=0;i<16;i++)tinyExcess.api.move(i%2);
const tiny=tinyExcess.snap().state;
check(Math.max(...tiny.values)>50&&Math.max(...tiny.values)<50.0001,'reachable excess is small but positive');
eq(tiny.phase,'failed','any positive excess fails at the cap');
check(tinyExcess.document.getElementById('toilet-0').classList.contains('too-full'),'tiny excess retains too-full styling');
check(Number(tinyExcess.document.getElementById('waste-0').textContent)>50,'adaptive formatting does not hide positive excess');

// A saved board that was playing/failed under the previous strict rule is
// re-evaluated with <=. The newly earned clear must be recorded while older
// clear/flushed records stay intact.
for(const oldPhase of ['playing','failed']) {
  const limit=oldPhase==='playing'?3:1;
  const oldRecords={
    [levels[0].id]:{best:2,flushed:true},
    [levels[1].id]:{best:levels[1].optimalMoves,flushed:true},
    [levels[7].id]:{best:levels[7].optimalMoves+1,flushed:false}
  };
  const oldSave={version:1,language:'zh',sound:false,records:oldRecords,current:0,session:{level:levels[0].id,values:[50,50],moves:1,history:[[80,20]],phase:oldPhase}};
  const restore=makeApp(new Map([[KEY,JSON.stringify(oldSave)]]),{levels:equalityPair(limit)});
  eq(restore.snap().state.phase,'won',`old ${oldPhase} equality board becomes won`);
  eq(restore.snap().state.values,[50,50],'migration preserves amounts before celebration flush');
  eq(restore.snap().state.moves,1,'migration preserves moves');
  eq(restore.snap().records[levels[0].id],{best:1,flushed:true},'restored inclusive win updates clear record and retains flushed status');
  eq(restore.snap().records[levels[1].id],oldRecords[levels[1].id],'other completed record preserved');
  eq(restore.snap().records[levels[7].id],oldRecords[levels[7].id],'other unfinished-flush record preserved');
  restore.tick(200);eq(restore.snap().modalKind,'victory','restored equality winner gets celebration');
  const stored=JSON.parse(restore.storage.get(KEY));eq(stored.session.phase,'won','inclusive migrated phase persisted');eq(stored.records[levels[0].id].best,1,'new clear score persisted');
}
const previouslyUnrecorded={version:1,language:'en',sound:false,records:{[levels[1].id]:{best:3,flushed:true}},current:0,session:{level:levels[0].id,values:[50,50],moves:1,history:[[80,20]],phase:'failed'}};
const newClear=makeApp(new Map([[KEY,JSON.stringify(previouslyUnrecorded)]]),{levels:equalityPair()});
eq(newClear.snap().records[levels[0].id].best,1,'restored newly eligible clear creates missing record');
eq(newClear.snap().records[levels[1].id],previouslyUnrecorded.records[levels[1].id],'newly created record does not erase previous progress');

const report={result:'pass',comparison:'inclusive <=',testType:'Actual application script in deterministic fake DOM; not a browser/layout/animation-rendering test',assertions,levels:allResults,checks:['language preserves state','every inclusive certificate wins','victory popup offers flush','inspect preserves clear','cleared reload','flush locks gameplay','interrupted flush reload','visible numerical drain progression','exact zero after flush','flush costs no moves','flushed reload','all records retained','near-limit no-op','failure modal','undo after failure and reload','restart','keyboard Enter/Space','reduced motion','corrupt JSON','blocked storage','initial equality ready styling/count','equality victory on final allowed move','tiny positive excess fails and remains visible','old playing/failed equality sessions migrate to won','restored inclusive clear creates/updates record','migration preserves all prior records']};
fs.writeFileSync(path.join(reportDir,'app-state-qa-results.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,levels:undefined},null,2));
