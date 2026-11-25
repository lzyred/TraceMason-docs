const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');

test('双端授权、独立到期、逐工具换钥与恢复', () => {
  const source = fs.readFileSync(path.join(__dirname, 'identity.js'), 'utf8');
  vm.runInNewContext(source + '\n' + String.raw`
const c=device('A',['openai-dev','claude-team']), b=device('B',['openai-review']);
const ticket=c.code;
activate(c,'http://192.168.1.2:8769',ticket);activate(b,'https://gateway.example',b.code);
const a1=c.current.token,b1=b.current.token;
assert.notEqual(a1,b1);assert.equal(authorize(a1,'openai-dev'),200);assert.equal(authorize(b1,'openai-review'),200);assert.equal(authorize('unknown','openai-review'),401);
assert.throws(()=>activate(c,c.address,ticket));
assert.equal(authorize(a1,'openai-review'),403);assert.equal(authorize(b1,'openai-dev'),403);
apply(c,'Codex','openai-dev','custom');apply(c,'Claude','claude-team','custom');c.tools.Codex.activity='活跃';
hour=144;sync(c);assert.equal(c.tools.Codex.written,1);assert.equal(c.tools.Claude.written,2);
verify(c,'Claude','未关联');assert.equal(c.tools.Claude.verified,0);
verify(c,'Claude','上游失败');assert.equal(c.tools.Claude.verified,2);assert.ok(c.next);
c.drop=true;c.grants=['claude-team'];sync(c);assert.equal(c.current.n,2);assert.ok(c.receipt);sync(c);assert.ok(!c.receipt);
assert.equal(authorize(c.current.token,'openai-dev'),403);assert.equal(authorize(a1,'claude-team'),401);
b.online=false;hour=168;assert.equal(authorize(b1,'openai-review'),401);
b.online=true;sync(b);assert.equal(b.current.n,2);
c.tools.Claude.activity='未知';hour=288;sync(c);const nextToken=c.next.token,pending=c.next.n;c.online=false;hour+=168;assert.equal(authorize(nextToken,'claude-team'),401);c.online=true;sync(c);assert.ok(c.next.n>pending);
c.tools.Claude.activity='空闲已确认';sync(c);verify(c,'Claude','拦截');assert.equal(c.next,null);
const stable=b.id,prior=b.current.token;unbind(b);activate(b,b.address,b.code);assert.equal(b.id,stable);assert.equal(authorize(prior,'openai-review'),401);assert.equal(authorize(b.current.token,'openai-review'),200);
apply(b,'Codex','openai-review','custom-model');
assert.equal(b.tools.Codex.model,'custom-model');
c.grants.push('gemini-lab');apply(c,'Gemini','gemini-lab','custom-gemini');
verify(c,'Gemini','成功');assert.match(c.tools.Gemini.result,/生成成功/);
const last=b.current.token;connectivity(b,false);unbind(b,true);
assert.equal(miniView(b).bound,true);assert.equal(miniView(b).revoked,false);
connectivity(b,true);assert.equal(miniView(b).revoked,true);assert.equal(authorize(last,'openai-review'),401);
`, {assert, URL, structuredClone, crypto: webcrypto});
});

test('确认丢包后 Mini 保留已知代号，断网和重绘均不能确认换钥', () => {
  const source = fs.readFileSync(path.join(__dirname, 'identity.js'), 'utf8');
  vm.runInNewContext(source + '\n' + String.raw`
    const d = device('工作站', ['openai-dev']);
    activate(d, 'http://gateway.example', d.code);
    apply(d, 'Codex', 'openai-dev', 'custom');
    hour = 144;
    sync(d);
    d.drop = true;
    verify(d, 'Codex', '成功');
    assert.equal(d.current.n, 2);
    assert.equal(knownGenerations(miniView(d)).current.n, 1);
    assert.equal(knownGenerations(miniView(d)).next.n, 2);
    connectivity(d, false);
    sync(d);
    assert.equal(knownGenerations(miniView(d)).current.n, 1);
    connectivity(d, true);
    assert.equal(knownGenerations(miniView(d)).current.n, 2);
    assert.equal(knownGenerations(miniView(d)).next, null);
  `, {assert, URL, structuredClone, crypto: webcrypto});
});
