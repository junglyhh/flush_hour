/* Pure rules shared by the standalone game and its verification. */
const FlushRules = Object.freeze({
  average(values, edge) {
    const [a,b] = edge;
    if (!Number.isInteger(a) || !Number.isInteger(b) || a === b || a < 0 || b < 0 || a >= values.length || b >= values.length) throw new Error('Invalid pipe');
    if (values[a] === values[b]) return { values: values.slice(), changed: false };
    const next = values.slice(), mean = (next[a] + next[b]) / 2;
    next[a] = mean; next[b] = mean;
    return { values: next, changed: true };
  },
  cleared(values, threshold) {
    return values.length > 0 && values.every(v => Number.isFinite(v) && v >= 0 && v <= threshold);
  },
  readyCount(values, threshold) { return values.filter(v => v <= threshold).length; },
  total(values) { return values.reduce((a,b) => a + b, 0); },
  phase(values, threshold, moves, moveLimit) {
    if (moves > moveLimit) return 'failed';
    if (this.cleared(values, threshold)) return 'won';
    return moves >= moveLimit ? 'failed' : 'playing';
  },
  percent(value, threshold = Infinity) {
    if (!Number.isFinite(value)) return '–';
    if (Number.isInteger(value)) return String(value);
    let places = 1;
    while (places < 7) {
      const displayed = Number(value.toFixed(places));
      if ((value <= threshold) === (displayed <= threshold) && (value === 0 || displayed > 0)) break;
      places++;
    }
    return value.toFixed(places).replace(/0+$/, '').replace(/\.$/, '');
  },
  validate(level) {
    if (!level || level.initial.length !== level.nodes.length || level.nodes.length < 2) throw new Error('Invalid toilets');
    if (!level.initial.every(v => Number.isInteger(v) && v >= 0 && v <= 100)) throw new Error('Invalid initial waste');
    if (!(level.threshold > 0 && level.threshold <= 100)) throw new Error('Invalid threshold');
    if (!(level.moveLimit >= level.optimalMoves && Number.isInteger(level.moveLimit))) throw new Error('Invalid move limit');
    if (this.total(level.initial) / level.nodes.length > level.threshold) throw new Error('Mean waste exceeds threshold');
    if (this.cleared(level.initial, level.threshold)) throw new Error('Level already cleared');
    const seen = new Set([0]);
    for (let pass=0;pass<level.nodes.length;pass++) for (const edge of level.edges) {
      this.average(level.initial,edge);
      if (seen.has(edge[0]) || seen.has(edge[1])) { seen.add(edge[0]); seen.add(edge[1]); }
    }
    if (seen.size !== level.nodes.length) throw new Error('Disconnected plumbing');
    return true;
  }
});

/* Keep full toilet cards and pipe controls separate, including on phones. */
function flushGeometry(level, width) {
  const w = Math.max(270, width);
  let normalized = level.nodes.map(n => ({x:n.x, y:n.y}));
  if (w >= 520 && ['star','cycle5','kite','double_t','bull','path5'].includes(level.shape)) {
    normalized = normalized.map(p => ({x:p.y, y:p.x}));
  }
  const intersects = (a,b,c) => {
    const p = [- (b.x-a.x), b.x-a.x, - (b.y-a.y), b.y-a.y];
    const q = [a.x-(c.x-50), (c.x+50)-a.x, a.y-(c.y-77.5), (c.y+77.5)-a.y];
    let low=0, high=1;
    for(let i=0;i<4;i++) {
      if(p[i]===0) {if(q[i]<0)return false;}
      else {const r=q[i]/p[i];if(p[i]<0)low=Math.max(low,r);else high=Math.min(high,r);if(low>high)return false;}
    }
    return true;
  };
  const fits = points => {
    for(let a=0;a<points.length;a++) for(let b=a+1;b<points.length;b++) {
      if(Math.abs(points[a].x-points[b].x)<88 && Math.abs(points[a].y-points[b].y)<143)return false;
    }
    const handles=[];
    for(const [a,b] of level.edges) {
      const pa=points[a],pb=points[b],handle={x:(pa.x+pb.x)/2,y:(pa.y+pb.y)/2-15};
      for(let i=0;i<points.length;i++) {
        const p=points[i],dx=Math.max(0,Math.abs(handle.x-p.x)-42),dy=Math.max(0,Math.abs(handle.y-p.y)-69.5);
        if(dx*dx+dy*dy<17*17)return false;
        if(i!==a&&i!==b&&intersects({x:pa.x,y:pa.y-15},{x:pb.x,y:pb.y-15},p))return false;
      }
      for(const previous of handles)if(Math.hypot(previous.x-handle.x,previous.y-handle.y)<34)return false;
      handles.push(handle);
    }
    return true;
  };
  let h=level.nodes.length<=2?350:level.nodes.length<=4?365:410,points;
  for(;h<=950;h+=20) {
    points=normalized.map(p=>({x:50+p.x*(w-100),y:96+p.y*(h-185)}));
    if(fits(points))return {w,h,points};
  }
  return {w,h:h-20,points};
}
