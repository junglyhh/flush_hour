'use strict';
// Independent arithmetic QA for Flush Hour. Verification sequences are
// test fixtures and are never included in the playable HTML.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'src');
const reportDir = path.join(root, '.qa-output');
fs.mkdirSync(reportDir, {recursive:true});
const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(source, 'game-core.js'), 'utf8') + '\nglobalThis.Rules = FlushRules;', context);
const R = context.Rules;
const levels = JSON.parse(fs.readFileSync(path.join(root, 'data', 'levels.json'), 'utf8'));
const verification = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'verification.json'), 'utf8'));
// Integer starting percentages and at most maxMoves halvings remain exact at
// this scale. Pick it from the campaign instead of assuming a fixed cap.
const maxMoves = Math.max(...levels.map(level => level.moveLimit));
const SCALE = 1n << BigInt(Math.max(32, maxMoves));
const reports = [];
let assertions = 0, replayedMoves = 0, exhaustivePaths = 0, sampledMoves = 0, formattedValues = 0;
const check = (condition, message) => { assertions++; assert.ok(condition, message); };
const eq = (actual, expected, message) => { assertions++; assert.equal(actual, expected, message); };
const vectorEq = (actual, expected, message) => { assertions++; assert.deepEqual(Array.from(actual), Array.from(expected), message); };
const throws = (f, message) => { assertions++; assert.throws(f, message); };
const fixed = numbers => numbers.map(n => BigInt(n) * SCALE);
const unfix = ints => ints.map(n => Number(n) / Number(SCALE));
function exactMove(values, edge) {
  const [a, b] = edge, next = values.slice();
  check((values[a] + values[b]) % 2n === 0n, 'reference precision sufficient');
  next[a] = next[b] = (values[a] + values[b]) / 2n;
  return next;
}
function fractionFixed(text) {
  const [num, den = '1'] = String(text).split('/');
  const n = BigInt(num), d = BigInt(den);
  check((n * SCALE) % d === 0n, 'certificate is a supported exact dyadic');
  return n * SCALE / d;
}
// Decode the threshold's actual IEEE-754 value to an exact rational. This
// supports the campaign's hundredth-percent thresholds without tolerances,
// decimal rounding, or assuming every threshold is an integer.
const thresholdRatios = new Map();
function thresholdRatio(value) {
  if (thresholdRatios.has(value)) return thresholdRatios.get(value);
  check(Number.isFinite(value), 'reference threshold is finite');
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0,value,false);
  const bits = view.getBigUint64(0,false), exponent = Number((bits >> 52n) & 2047n);
  const fraction = bits & ((1n << 52n) - 1n);
  const mantissa = (exponent === 0 ? fraction : (1n << 52n) + fraction) * ((bits >> 63n) ? -1n : 1n);
  const power = exponent === 0 ? -1074 : exponent - 1075;
  const ratio = power >= 0 ? [mantissa << BigInt(power),1n] : [mantissa,1n << BigInt(-power)];
  thresholdRatios.set(value,ratio);
  return ratio;
}
function inclusiveClear(ints, threshold) {
  const [numerator,denominator] = thresholdRatio(threshold);
  return ints.every(n => n * denominator <= numerator * SCALE);
}
function checkFormatting(values, threshold) {
  for (const value of values) {
    const text = R.percent(value, threshold), displayed = Number(text);
    check(Number.isFinite(displayed), `finite percentage: ${value}`);
    eq(displayed <= threshold, value <= threshold, `rounded label preserves threshold status: ${value} <= ${threshold}`);
    if (value > 0) check(displayed > 0, 'positive waste must not display zero');
    if (value === 0) eq(text, '0', 'empty toilet displays zero');
    formattedValues++;
  }
}
function assertTransition(level, jsValues, ints, edge) {
  const before = jsValues.slice(), exactNext = exactMove(ints, edge);
  const result = R.average(jsValues, edge);
  vectorEq(jsValues, before, 'averaging does not mutate the caller');
  check(result.values !== jsValues, 'averaging returns a new array');
  eq(result.changed, before[edge[0]] !== before[edge[1]], 'no-op flag reflects equal endpoints');
  vectorEq(result.values, unfix(exactNext), 'JS arithmetic matches independent BigInt reference');
  eq(R.total(result.values), R.total(level.initial), 'floating total is exactly conserved');
  eq(exactNext.reduce((a, b) => a + b, 0n), fixed(level.initial).reduce((a, b) => a + b, 0n), 'BigInt total is exactly conserved');
  eq(R.cleared(result.values, level.threshold), inclusiveClear(exactNext, level.threshold), 'inclusive predicate matches reference');
  check(result.values.every(n => n >= 0 && n <= 100), 'convex averaging preserves percentage bounds');
  for (let i = 0; i < before.length; i++) if (!edge.includes(i)) eq(result.values[i], before[i], 'unconnected toilet unchanged');
  checkFormatting(result.values, level.threshold);
  return { js: result.values, exact: exactNext, changed: result.changed };
}

eq(levels.length, 30, 'thirty playable levels');
vectorEq(levels.map(level => level.optimalMoves),Array.from({length:30},(_,index) => index+1),'verified minimum move counts increase from one through thirty');
eq(new Set(levels.map(l => l.id)).size, levels.length, 'unique level identifiers');
eq(verification.levels.length, levels.length, 'one proof certificate per level');
vectorEq(verification.levels.map(l => l.id).sort(), levels.map(l => l.id).sort(), 'certificate IDs exactly match the playable campaign');
const tierRank = {easy: 0, medium: 1, hard: 2, master: 3};
for (let index = 0; index < levels.length; index++) {
  const level = levels[index], certificate = verification.levels.find(v => v.id === level.id);
  check(certificate, 'every level has a separate certificate');
  check(Number.isInteger(level.optimalMoves) && level.optimalMoves > 0, 'positive integer optimum');
  check(Number.isInteger(level.moveLimit) && level.moveLimit <= 32, 'move budget remains within the exact-arithmetic campaign bound');
  check(level.initial.every(Number.isInteger), 'campaign starts use integer percentages');
  check(/^\d+(?:\.\d{1,2})?$/.test(String(level.threshold)), 'threshold is readable with at most two decimal places');
  check(Object.hasOwn(tierRank, level.difficulty), 'recognized difficulty tier');
  for (const language of ['en','zh']) {
    check(typeof level.name[language] === 'string' && level.name[language].trim(), 'each level has a localized name');
    check(typeof level.tagline[language] === 'string' && level.tagline[language].trim(), 'each level has a localized description');
    check(Array.isArray(level.hints[language]) && level.hints[language].length > 0 && level.hints[language].every(text => typeof text === 'string' && text.trim()), 'each level has localized hints');
  }
  eq(new Set(level.nodes.map(node => node.id)).size, level.nodes.length, 'toilet identifiers are unique inside each level');
  eq(new Set(level.edges.map(edge => edge.slice().sort((a,b) => a-b).join(','))).size, level.edges.length, 'pipes are unique even when endpoint order is reversed');
  eq(R.validate(level), true, 'level passes actual rule validation');
  check(R.total(level.initial) / level.nodes.length <= level.threshold, 'average at or below inclusive threshold');
  eq(R.cleared(level.initial, level.threshold), false, 'puzzle initially unsolved');
  if (index) {
    check(tierRank[levels[index-1].difficulty] <= tierRank[level.difficulty], 'difficulty tier never decreases');
    check(levels[index-1].optimalMoves < level.optimalMoves, 'every successive puzzle requires strictly more minimum moves');
  }
  eq(certificate.sequenceEdgeIndices.length, level.optimalMoves, 'certificate length equals stated optimum');
  eq(certificate.optimalMoves, level.optimalMoves, 'certificate optimum is current');
  eq(certificate.moveLimit, level.moveLimit, 'certificate move budget is current');
  eq(certificate.threshold, level.threshold, 'certificate threshold is current');
  eq(certificate.initialTotal, R.total(level.initial), 'certificate total is current');
  eq(certificate.exactStates.length, level.optimalMoves + 1, 'certificate includes initial and every subsequent state');
  vectorEq(certificate.exactStates[0].map(fractionFixed), fixed(level.initial), 'certificate begins at the current initial board');
  eq(certificate.independentExhaustiveSearch.depth, level.optimalMoves - 1, 'independent proof searched optimum minus one');
  eq(certificate.independentExhaustiveSearch.solutionFound, false, 'independent proof found no shorter solution');
  check(level.moveLimit >= level.optimalMoves, 'every budget permits its verified optimal solution');
  let js = level.initial.slice(), ints = fixed(level.initial), moves = 0;
  for (const edgeIndex of certificate.sequenceEdgeIndices) {
    check(level.edges[edgeIndex], 'certificate edge exists');
    const next = assertTransition(level, js, ints, level.edges[edgeIndex]);
    check(next.changed, 'certified move is not a no-op');
    js = next.js; ints = next.exact; moves++;
    const expectedPhase = moves === certificate.sequenceEdgeIndices.length ? 'won' : 'playing';
    eq(R.phase(js, level.threshold, moves, level.moveLimit), expectedPhase, 'real phase honors final winning step');
    const expectedInts = certificate.exactStates[moves].map(fractionFixed);
    vectorEq(ints, expectedInts, 'independent reference matches each exact certificate state');
    replayedMoves++;
  }
  check(inclusiveClear(ints, level.threshold), 'every final toilet passes inclusively');
  check(js.every(n => n <= level.threshold), 'real final values pass');
  vectorEq(ints, certificate.finalFractions.map(fractionFixed), 'final certificate fractions match');
  eq(R.phase(js, level.threshold, level.moveLimit, level.moveLimit), 'won', 'clear on final allowed move wins');
  eq(R.phase(js, level.threshold, level.moveLimit + 1, level.moveLimit), 'failed', 'clear after budget fails');
  reports.push({id:level.id, optimalMoves:level.optimalMoves, moveLimit:level.moveLimit, total:R.total(level.initial), threshold:level.threshold, highestFinal:Math.max(...js), result:'pass'});
}

// Explore every pipe-index sequence through depth five; unlike a gameplay
// walkthrough these include no-ops, reversals, unsafe re-sharing, and states
// that have already crossed the goal threshold.
function explore(level, js, ints, depth) {
  if (!depth) { exhaustivePaths++; return; }
  for (const edge of level.edges) {
    const next = assertTransition(level, js, ints, edge);
    explore(level, next.js, next.exact, depth - 1);
  }
}
for (const level of levels) explore(level, level.initial.slice(), fixed(level.initial), Math.min(5, level.moveLimit));

// Seeded full-budget paths check every production depth in the campaign.
let random = 0x612940ab;
function nextRandom() { random = (Math.imul(random, 1664525) + 1013904223) >>> 0; return random; }
for (const level of levels) for (let sample = 0; sample < 100; sample++) {
  let js = level.initial.slice(), ints = fixed(level.initial);
  for (let step = 0; step < level.moveLimit; step++) {
    const edge = level.edges[nextRandom() % level.edges.length];
    const next = assertTransition(level, js, ints, edge); js = next.js; ints = next.exact; sampledMoves++;
  }
}

// Boundary cases: equality counts; any positive excess still fails.
for (const threshold of [...new Set([35,40,44,48,50,55,56,60,...levels.map(level => level.threshold)])]) {
  eq(R.cleared([threshold, 0], threshold), true, 'exact threshold passes');
  eq(R.cleared([threshold, threshold], threshold), true, 'all toilets exactly at threshold pass');
  eq(R.readyCount([threshold, threshold + 1/65536, 0], threshold), 2, 'ready count includes equality but excludes positive excess');
  eq(R.cleared([threshold - 1/65536, 0], threshold), true, 'strictly below threshold passes');
  eq(R.cleared([threshold + 1/65536, 0], threshold), false, 'strictly above threshold fails');
  checkFormatting([0,1/65536,threshold - 1/65536,threshold,threshold + 1/65536,99.99998474121094], threshold);
  for (let i = 1; i <= maxMoves; i++) checkFormatting([1/(2**i),threshold - 1/(2**i), threshold + 1/(2**i)], threshold);
  const same = R.average([threshold,threshold], [0,1]);
  eq(same.changed, false, 'equal endpoints have no move');
  vectorEq(same.values, [threshold,threshold], 'equal endpoints unchanged');
}
eq(R.cleared([],50), false, 'empty vertex list fails');
for (const invalid of [NaN,Infinity,-Infinity,-1]) eq(R.cleared([invalid,0],50), false, 'invalid percentage cannot win');
for (const edge of [[0,0],[-1,1],[0,2],[0.5,1],['0',1]]) throws(() => R.average([80,20],edge), 'invalid endpoint rejected');
eq(R.phase([80,20],55,2,3), 'playing', 'unfinished with time left');
eq(R.phase([80,20],55,3,3), 'failed', 'unfinished at budget fails');
eq(R.phase([50,50],55,3,3), 'won', 'goal beats limit failure on last legal move');
eq(R.phase([50,50],55,4,3), 'failed', 'past budget cannot win');

// A fixed, valid path fixture keeps validation tests independent of ordering
// and difficulty changes in the campaign.
const base = {
  id:'qa-validation-path', nodes:[{id:'A',x:0,y:0},{id:'B',x:1,y:.5},{id:'C',x:0,y:1}],
  edges:[[0,1],[1,2]], initial:[90,0,0], threshold:40, optimalMoves:3, moveLimit:5
};
const clone = () => JSON.parse(JSON.stringify(base));
for (const mutate of [
 l => l.initial.pop(),
 l => l.initial[0] = 100.5,
 l => l.initial[0] = -1,
 l => l.threshold = 0,
 l => l.threshold = 101,
 l => l.threshold = 29,
 l => l.moveLimit = 2,
 l => l.moveLimit = 5.5,
 l => l.edges = [[0,1]],
 l => l.edges = [[0,1],[1,3]],
 l => l.initial = [10,10,10]
]) { const bad = clone(); mutate(bad); throws(() => R.validate(bad), 'malformed or impossible level rejected'); }

const equalMean = {id:'qa-equal-mean',nodes:[{id:'A',x:0,y:.5},{id:'B',x:1,y:.5}],edges:[[0,1]],initial:[80,20],threshold:50,optimalMoves:1,moveLimit:1};
eq(R.validate(equalMean), true, 'a feasible equal-mean threshold is allowed');
eq(R.phase([50,50],50,1,1), 'won', 'equality wins on the final allowed move');
eq(R.phase([50 + 1/65536,50 - 1/65536],50,1,1), 'failed', 'tiny positive excess fails even on final move');

const result = {result:'pass', comparison:'inclusive <=', assertions, replayedMoves, exhaustivePaths, sampledMoves, formattedValues, levels:reports};
const out = path.join(reportDir, 'rules-qa-results.json');
fs.writeFileSync(out, JSON.stringify(result,null,2) + '\n');
console.log(JSON.stringify({...result,levels:undefined,report:path.relative(root,out)},null,2));
