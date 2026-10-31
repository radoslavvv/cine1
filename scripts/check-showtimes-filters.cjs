const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('../src/frontend/node_modules/typescript');
const {
  QueryClient,
  QueryObserver,
  keepPreviousData,
  queryOptions,
} = require('../src/frontend/node_modules/@tanstack/react-query');

function loadQueries(fetch) {
  const source = readFileSync(
    path.join(
      __dirname,
      '../src/frontend/src/features/showtimes/api/showtimesQueries.ts',
    ),
    'utf8',
  );
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    URLSearchParams,
    fetch,
    require(name) {
      assert.equal(name, '@tanstack/react-query');
      return { queryOptions, keepPreviousData };
    },
  });
  return exports.showtimesQueries;
}

const source = readFileSync(
  path.join(
    __dirname,
    '../src/frontend/src/features/showtimes/model/showtimesFilters.ts',
  ),
  'utf8',
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
});
const model = {};
vm.runInNewContext(outputText, { exports: model });
const { readShowtimesFilters } = model;
const dates = [{ key: '2026-10-28' }, { key: '2026-10-29' }];
test('default filters require 2D', () => {
  const state = readShowtimesFilters(new URLSearchParams(), dates);
  assert.equal(state.format, '2D');
});

test('shared URLs restore date and encoded formats on reload', () => {
  const state = readShowtimesFilters(
    new URLSearchParams('date=2026-10-29&genre=Sci-Fi&format=IMAX+3D'),
    dates,
  );
  assert.equal(state.selectedIndex, 1);
  assert.equal(state.genre, 'Sci-Fi');
  assert.equal(state.format, 'IMAX 3D');
});

test('invalid or expired date and unknown format fall back safely', () => {
  const state = readShowtimesFilters(
    new URLSearchParams('date=1999-01-01&format=bogus&genre=Unavailable'),
    dates,
  );
  assert.equal(state.selectedIndex, 0);
  assert.equal(state.format, '2D');
  assert.equal(state.genre, 'Unavailable');
});

test('requests include all selections and preserve cancellation', async () => {
  const controller = new AbortController();
  let request;
  const queries = loadQueries(async (url, options) => {
    request = { url, options };
    return { ok: true, json: async () => [] };
  });
  await queries
    .forFilters(dates[0].key, 'Sci-Fi & Adventure', 'IMAX 3D')
    .queryFn({ signal: controller.signal });
  const url = new URL(request.url, 'http://localhost');
  assert.equal(url.searchParams.get('date'), dates[0].key);
  assert.equal(url.searchParams.get('genre'), 'Sci-Fi & Adventure');
  assert.equal(url.searchParams.get('format'), 'IMAX 3D');
  assert.equal(request.options.signal, controller.signal);
});

test('recent filter results are reused immediately with a separate cache entry', async () => {
  const calls = [];
  const queries = loadQueries(async (url) => {
    calls.push(url);
    return { ok: true, json: async () => [{ request: url }] };
  });
  const client = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity } },
  });
  try {
    const twoD = queries.forFilters(dates[0].key, '', '2D');
    await client.fetchQuery(twoD);
    await client.fetchQuery(queries.forFilters(dates[0].key, '', '3D'));
    await client.fetchQuery(queries.forFilters(dates[0].key, 'Comedy', '3D'));
    await client.fetchQuery(queries.forFilters(dates[1].key, 'Comedy', '3D'));
    await client.fetchQuery(twoD);
    assert.equal(
      calls.length,
      4,
      'Returning to a recent filter must not wait on another request',
    );
    assert.equal(client.getQueryCache().getAll().length, 4);
    assert.equal(
      new URL(calls[0], 'http://localhost').searchParams.get('format'),
      '2D',
    );
    assert.equal(
      new URL(calls[0], 'http://localhost').searchParams.has('genre'),
      false,
    );
    assert.equal(client.getQueryData(twoD.queryKey)[0].request, calls[0]);
  } finally {
    client.clear();
  }
});

test('uncached filter changes keep the showtimes mounted during the request', async () => {
  let finish;
  const queries = loadQueries(() => new Promise((resolve) => { finish = resolve; }));
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
  const first = queries.forFilters(dates[0].key, '', '2D');
  client.setQueryData(first.queryKey, [{ id: 1 }]);
  const observer = new QueryObserver(client, first);
  const unsubscribe = observer.subscribe(() => {});
  try {
    observer.setOptions(queries.forFilters(dates[0].key, '', '3D'));
    const pending = observer.getCurrentResult();
    assert.equal(pending.data?.[0].id, 1, 'Visible results must survive a pending filter change');
    assert.equal(pending.isPlaceholderData, true);
  } finally {
    finish?.({ ok: true, json: async () => [] });
    unsubscribe();
    client.clear();
  }
});

test('failed filtered requests reach the existing error handling', async () => {
  const queries = loadQueries(async () => ({ ok: false, status: 400 }));
  await assert.rejects(
    queries
      .forFilters(dates[0].key, '', '2D')
      .queryFn({ signal: new AbortController().signal }),
    /Showtimes request failed \(400\)/,
  );
});
