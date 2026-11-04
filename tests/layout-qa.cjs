'use strict';
// Independent geometry checks for the actual Flush Hour layout function.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'src');
const reportDir = path.join(root, '.qa-output');
fs.mkdirSync(reportDir, {recursive:true});
const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(source, 'game-core.js'), 'utf8'), context);
const layout = vm.runInContext('flushGeometry', context);
const levels = JSON.parse(fs.readFileSync(path.join(root, 'data', 'levels.json'), 'utf8'));
assert.equal(levels.length,30,'responsive geometry covers the complete thirty-level campaign');
const widths = [...new Set([
  ...Array.from({length:64}, (_, i) => 270 + 10*i),
  293,342,348,519,521,1024
])].sort((a,b)=>a-b);

// Liang–Barsky's equivalent two-axis slab method, independent of the game's
// four-boundary implementation. The 8px expansion covers the visible pipe.
function segmentHitsRect(a,b,c) {
  let enter = 0, leave = 1;
  for (const [axis, radius] of [['x',50],['y',77.5]]) {
    const delta = b[axis] - a[axis];
    const lower = c[axis] - radius, upper = c[axis] + radius;
    if (Math.abs(delta) < 1e-10) {
      if (a[axis] < lower || a[axis] > upper) return false;
    } else {
      const t1 = (lower-a[axis])/delta, t2 = (upper-a[axis])/delta;
      enter = Math.max(enter, Math.min(t1,t2));
      leave = Math.min(leave, Math.max(t1,t2));
      if (enter > leave) return false;
    }
  }
  return true;
}

const summary = {layouts:0, minBoardWidth:widths[0], maxBoardWidth:widths.at(-1), maxBoardHeight:0, sampleHeights:{}};
for (const width of widths) {
  const sample=[];
  for (const level of levels) {
    const {w,h,points} = layout(level, width);
    const tag = `${level.id} at width ${width}`;
    assert.equal(w,width,`${tag}: board preserves its available width`);
    assert.equal(points.length,level.nodes.length,`${tag}: one position per toilet`);
    assert(Number.isFinite(h) && h<950, `${tag}: solver exhausted its bounds`);
    for (let i=0;i<points.length;i++) {
      const p=points[i];
      assert(Number.isFinite(p.x)&&Number.isFinite(p.y),`${tag}: finite toilet coordinates`);
      assert(p.x-42>=0 && p.x+42<=w, `${tag}: toilet ${i} horizontal clipping`);
      assert(p.y-69.5>=0 && p.y+69.5<=h, `${tag}: toilet ${i} vertical clipping`);
      for (let j=0;j<i;j++) {
        const q=points[j];
        assert(Math.abs(p.x-q.x)>=88 || Math.abs(p.y-q.y)>=143, `${tag}: overlapping cards ${j}/${i}`);
      }
    }
    const handles=[];
    for (const [a,b] of level.edges) {
      const pa={x:points[a].x,y:points[a].y-15}, pb={x:points[b].x,y:points[b].y-15};
      const button={x:(pa.x+pb.x)/2,y:(pa.y+pb.y)/2};
      for (let i=0;i<points.length;i++) {
        const p=points[i];
        const nearX=Math.max(p.x-42, Math.min(button.x,p.x+42));
        const nearY=Math.max(p.y-69.5, Math.min(button.y,p.y+69.5));
        assert(Math.hypot(button.x-nearX, button.y-nearY)>=17-1e-8, `${tag}: pipe ${a}/${b} button covered by toilet ${i}`);
        if(i!==a&&i!==b) {
          assert(!segmentHitsRect(pa,pb,p), `${tag}: pipe ${a}/${b} crosses unrelated toilet ${i}`);
        }
      }
      for(const prior of handles) {
        assert(Math.hypot(button.x-prior.x,button.y-prior.y)>=34-1e-8, `${tag}: overlapping pipe buttons`);
      }
      handles.push(button);
    }
    summary.layouts++;
    summary.maxBoardHeight=Math.max(summary.maxBoardHeight,h);
    sample.push(h);
  }
  if([270,293,348,520,600,700,900].includes(width))summary.sampleHeights[width]=sample;
}
fs.writeFileSync(path.join(reportDir,'layout-qa-results.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify(summary,null,2));
