const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('../src/frontend/node_modules/typescript');
const React = require('../src/frontend/node_modules/react');
const { renderToStaticMarkup } = require('../src/frontend/node_modules/react-dom/server');
const { MemoryRouter } = require('../src/frontend/node_modules/react-router-dom');

function load(file, state) {
  const { outputText } = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  });
  const exports = {};
  vm.runInNewContext(outputText, { exports, require(name) {
    if (name.endsWith('/useSchedule')) return { useSchedule: () => state };
    if (name.endsWith('/useBookingPage')) return { useBookingPage: () => state };
    if (name.endsWith('/useConfirmationPage')) return { useConfirmationPage: () => state };
    if (name.endsWith('/MovieArtwork')) return { MovieArtwork: () => null };
    if (name.endsWith('/CarpetFooter')) return { CarpetFooter: () => null };
    if (name.startsWith('@/')) {
      const target = path.resolve(__dirname, '../src/frontend/src', name.slice(2));
      return load([target + '.ts', target + '.tsx'].find(require('node:fs').existsSync), state);
    }
    if (!name.startsWith('.')) return require('../src/frontend/node_modules/' + name);
    const target = path.resolve(path.dirname(file), name);
    return load([target + '.ts', target + '.tsx'].find(require('node:fs').existsSync), state);
  }});
  return exports;
}

const state = {
  dates: [{ key: '2026-10-30', fullLabel: 'Today', day: 'Fri', date: 30 }],
  selectedIndex: 0, selectedDate: { fullLabel: 'Today' }, genre: '', format: '2D', genres: [],
  isPending: false, isFetching: false, isPaused: false, isError: false,
};

function render(overrides) {
  const { SchedulePage } = load(path.resolve(__dirname, '../src/frontend/src/features/schedule/pages/SchedulePage.tsx'), { ...state, ...overrides });
  return renderToStaticMarkup(React.createElement(MemoryRouter, null, React.createElement(SchedulePage)));
}

function hiddenAncestors(html, marker) {
  const stack = [];
  for (const match of html.matchAll(/<[^>]+>|[^<]+/g)) {
    const tag = match[0];
    if (tag.includes(marker)) return stack.filter((tag) => /opacity:0(?:[;"\s])/.test(tag));
    if (tag.startsWith('</')) stack.pop();
    else if (tag.startsWith('<') && !/^<(?:img|input|br|hr|meta|link)\b/.test(tag)) stack.push(tag);
  }
  assert.fail('Content marker not found');
}

test('loaded movie is visible immediately, without nested entrance fades', () => {
  const html = render({ movies: [{ id: 1, title: 'Regression movie', genres: [], durationMinutes: 90, synopsis: '', showtimes: [] }] });
  assert.deepEqual(hiddenAncestors(html, 'Regression movie'), []);
});

test('initial skeleton is visible immediately', () => {
  const html = render({ movies: undefined, isPending: true });
  assert.deepEqual(hiddenAncestors(html, 'space-y-4 py-2'), []);
});

test('stale results cannot be booked while a different filter is loading', () => {
  const html = render({ isUpdating: true, movies: [{ id: 1, title: 'Previous selection', genres: [], durationMinutes: 90, synopsis: '', showtimes: [] }] });
  assert.match(html, /aria-busy="true"/);
  assert.match(html, /<div inert="">/);
  assert.match(html, /Updating screenings/);
});

for (const name of ['BookingPage', 'ConfirmationPage']) {
  test(`${name} skeleton is visible immediately`, () => {
    const page = load(path.resolve(__dirname, `../src/frontend/src/features/booking/pages/${name}.tsx`), { query: {} })[name];
    const html = renderToStaticMarkup(React.createElement(MemoryRouter, null, React.createElement(page)));
    assert.deepEqual(hiddenAncestors(html, 'aria-busy="true"'), []);
  });
}

test('booking details do not disappear behind another entrance after loading', () => {
  const page = load(path.resolve(__dirname, '../src/frontend/src/features/booking/pages/BookingPage.tsx'), {
    query: { data: { movie: { title: 'Loaded booking', genres: [], durationMinutes: 90 }, auditorium: { name: 'One' }, seats: [] } },
    selectedSeats: [], isOpen: true,
  }).BookingPage;
  const html = renderToStaticMarkup(React.createElement(MemoryRouter, null, React.createElement(page)));
  assert.deepEqual(hiddenAncestors(html, 'Loaded booking'), []);
});
