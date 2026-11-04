'use strict';
// Dependency-free runner. All paths are relative to this project, not the cwd.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {spawnSync} = require('node:child_process');

const root = path.resolve(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'index.html'));
const standalone = fs.readFileSync(path.join(root, 'flush_hour.html'));
assert.ok(index.equals(standalone), 'index.html and flush_hour.html must be byte-identical');
const built=index.toString('utf8');
for(const name of ['game-core.js','campaign.js','legacy-levels.js','toilet-visual.js','share.js']) {
  const source=fs.readFileSync(path.join(root,'src',name),'utf8');
  assert.ok(built.includes(source),`Built application must embed the current ${name}`);
}
console.log(`Built entry points match (${index.length.toLocaleString('en-US')} bytes).`);

for (const name of ['rules-qa.cjs', 'app-state-qa.cjs', 'layout-qa.cjs', 'share-qa.cjs']) {
  console.log(`\nRunning ${name}`);
  const result = spawnSync(process.execPath, [path.join(__dirname, name)], {
    cwd:root,
    stdio:'inherit'
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    console.error(`${name} failed${result.signal ? ` with signal ${result.signal}` : ''}.`);
    process.exit(result.status || 1);
  }
}
console.log('\nAll Flush Hour verification suites passed. Reports: .qa-output/');
