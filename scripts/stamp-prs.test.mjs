import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { card, pick, shorten, stamp } from './stamp-prs.mjs';

const page = readFileSync(new URL('../site/index.html', import.meta.url), 'utf8');

test('writes the oldest waiting pull request into the card', () => {
  const html = stamp(page, [
    { number: 52, title: 'fix(ui): keep the caption bar draggable' },
    { number: 60, title: 'feat(agent): something newer' },
  ]);

  assert.match(html, /Ask for a review on chief\.ai#52/);
  assert.match(html, /take a look at #52 when you have a moment/);
  assert.match(html, /keep the caption bar draggable/);
  assert.doesNotMatch(html, /#60/);
  assert.doesNotMatch(html, /example/);
});

test('an empty list puts back the example card and says it is one', () => {
  const html = stamp(page, []);

  assert.match(html, /drafted for you · example · nothing sent/);
  assert.match(html, /chief\.ai#51/);
});

test('a live card never says example, and an example card always does', () => {
  assert.doesNotMatch(card({ number: 1, title: 'a' }), /example/);
  assert.match(card(null), /example/);
});

test('stamping twice gives the same page as stamping once', () => {
  const prs = [{ number: 7, title: 'one' }];
  const once = stamp(page, prs);

  assert.equal(stamp(once, prs), once);
});

test('a title cannot add markup to the page', () => {
  const html = stamp(page, [{ number: 9, title: '<script>alert("x")</script> & "more"' }]);

  assert.doesNotMatch(html, /<script>alert/);
  assert.match(html, /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt; &amp; &quot;more&quot;/);
});

test('anything that is not a pull request is skipped, not shown', () => {
  assert.equal(pick(null), null);
  assert.equal(pick('nope'), null);
  assert.equal(
    pick([null, 3, { number: '5', title: 'x' }, { number: 5 }, { number: 0, title: 'x' }]),
    null,
  );
  assert.deepEqual(pick([{ number: 5 }, { number: 6, title: '  ok  ' }]), {
    number: 6,
    title: 'ok',
  });
});

test('a long title is shortened to one line', () => {
  const out = shorten(`${'word '.repeat(40)}\nend`);

  assert.ok(out.length <= 72);
  assert.ok(out.endsWith('…'));
  assert.ok(!out.includes('\n'));
});

test('refuses a page whose markers are missing or doubled', () => {
  assert.throws(() => stamp('<p>nothing here</p>', []), /expected one/);
  assert.throws(() => stamp(page + page, []), /expected one/);
});

test('leaves the rest of the page alone', () => {
  const html = stamp(page, [{ number: 12, title: 'x' }]);
  const outside = (text) =>
    text.slice(0, text.indexOf('<!-- open-pr:start -->')) +
    text.slice(text.indexOf('<!-- open-pr:end -->'));

  assert.equal(outside(html), outside(page));
});
