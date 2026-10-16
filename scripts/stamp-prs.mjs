// Writes an open pull request into the picture of the app on the home page.
//
// The site makes no requests of its own, so the card in the mock-up cannot
// fetch anything. Instead the app repo sends the list of open pull requests
// here whenever one changes, and this script bakes the oldest waiting one into
// the HTML between the `open-pr` markers, the way the release stamps a version.
// With nothing to show it writes the example card back, labelled as one: a
// picture that looks real but is not is the thing to avoid.
//
//   node scripts/stamp-prs.mjs <payload.json> [site/index.html]
//
// where the payload is `[{ "number": 52, "title": "…" }, …]`, oldest first.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const START = '<!-- open-pr:start -->';
const END = '<!-- open-pr:end -->';
const INDENT = '                  ';
const MAX_TITLE = 72;

export function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** The first entry that is a pull request, or `null`. Anything else is ignored. */
export function pick(prs) {
  if (!Array.isArray(prs)) return null;

  for (const pr of prs) {
    if (
      pr !== null &&
      typeof pr === 'object' &&
      Number.isInteger(pr.number) &&
      pr.number > 0 &&
      typeof pr.title === 'string' &&
      pr.title.trim() !== ''
    ) {
      return { number: pr.number, title: pr.title.trim() };
    }
  }

  return null;
}

export function shorten(title) {
  const flat = title.replace(/\s+/g, ' ');
  return flat.length > MAX_TITLE ? `${flat.slice(0, MAX_TITLE - 1).trimEnd()}…` : flat;
}

export function card(pr) {
  const live = pr !== null;
  const label = live
    ? 'drafted for you · nothing sent'
    : 'drafted for you · example · nothing sent';
  const head = live
    ? `Ask for a review on chief.ai#${pr.number}`
    : 'Ask for a review on chief.ai#51';
  const body = live
    ? `Hi, could you take a look at #${pr.number} when you have a moment? It is “${escapeHtml(shorten(pr.title))}”.`
    : 'Hi Sam — could you take a look at #51 when you have a moment? It is a one-line fix to the caption bar drag.';

  return [
    '<!-- prettier-ignore -->',
    '<div class="drafted">',
    `  <p class="micro">${label}</p>`,
    '  <div class="draft-card">',
    '    <div class="draft-head">',
    `      <p>${head}</p>`,
    '      <span class="app-chip is-quiet">Not sent</span>',
    '    </div>',
    `    <p class="draft-body">${body}</p>`,
    '  </div>',
    '</div>',
  ]
    .map((line) => INDENT + line)
    .join('\n');
}

/** `html` with the card between the markers replaced. Throws if the markers are not there once. */
export function stamp(html, prs) {
  const starts = html.split(START).length - 1;
  const ends = html.split(END).length - 1;
  if (starts !== 1 || ends !== 1) {
    throw new Error(`expected one ${START} and one ${END}, found ${starts} and ${ends}`);
  }

  const from = html.indexOf(START) + START.length;
  const to = html.indexOf(END);
  if (to < from) throw new Error('the open-pr markers are the wrong way round');

  return `${html.slice(0, from)}\n${card(pick(prs))}\n${INDENT}${html.slice(to)}`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [payload, page = 'site/index.html'] = process.argv.slice(2);
  if (!payload) {
    console.error('usage: node scripts/stamp-prs.mjs <payload.json> [page]');
    process.exit(2);
  }

  const before = readFileSync(page, 'utf8');
  const after = stamp(before, JSON.parse(readFileSync(payload, 'utf8')));
  if (after !== before) writeFileSync(page, after);
  console.log(after === before ? 'no change' : 'stamped');
}
