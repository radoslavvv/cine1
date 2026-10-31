const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('../src/frontend/node_modules/typescript');

function load(name) {
  const file = path.join(
    __dirname,
    '../src/frontend/src/features/showtimes/model',
    name + '.ts',
  );
  const { outputText } = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const exports = {};

  vm.runInNewContext(outputText, {
    exports,
    require: (dependency) => load(dependency),
  });

  return exports;
}

const { getShowtimesMovies, getShowtimesGenres } = load(
  'showtimesPresentation',
);

const movie = (id, genres = []) => {
  return {
    id,
    title: `Movie ${id}`,
    genres,
    durationMinutes: 90,
    synopsis: '',
  };
};

const showtime = (id, film, startsAt) => {
  return {
    id,
    movie: film,
    startsAt,
    format: '2D',
    auditorium: { id: 1, name: 'One' },
  };
};

const now = Date.parse('2026-10-28T12:00:00Z');

test('loading and loaded empty results remain distinct', () => {
  assert.equal(getShowtimesMovies(undefined, now), undefined);
  assert.equal(getShowtimesMovies([], now).length, 0);
});

test('interleaved showtimes group by movie without reordering movies or their screenings', () => {
  const first = movie(2);
  const second = movie(1);
  const input = [
    showtime(8, first, '2026-10-28T14:00:00Z'),
    showtime(9, second, '2026-10-28T13:00:00Z'),
    showtime(10, first, '2026-10-28T15:00:00Z'),
  ];
  const output = getShowtimesMovies(input, now);

  assert.equal(
    JSON.stringify(
      output.map((film) => [
        film.id,
        film.showtimes.map((screening) => screening.id),
      ]),
    ),
    '[[2,[8,10]],[1,[9]]]',
  );
  assert.equal(
    input[0].status,
    undefined,
    'query-cache objects must not be modified',
  );
});

test('status changes exactly at screening start and runtime end, and labels use Kyiv time', () => {
  const input = [showtime(1, movie(1), '2026-10-28T12:00:00Z')];

  const screening = (time) => {
    return getShowtimesMovies(input, time)[0].showtimes[0];
  };

  assert.equal(screening(now - 1).status, 'Upcoming');
  assert.equal(screening(now).status, 'Started');
  assert.equal(screening(now + 90 * 60000 - 1).status, 'Started');
  assert.equal(screening(now + 90 * 60000).status, 'Finished');
  assert.equal(screening(now).timeLabel, '14:00');
});

test('genre options stay unique and keep the selected genre when results omit it', () => {
  const input = [
    showtime(1, movie(1, ['Drama', 'Comedy', 'Drama']), '2026-10-28T12:00:00Z'),
  ];

  assert.equal(
    JSON.stringify(getShowtimesGenres(input, 'Sci-Fi')),
    '["Comedy","Drama","Sci-Fi"]',
  );
  assert.equal(
    JSON.stringify(getShowtimesGenres(undefined, 'Sci-Fi')),
    '["Sci-Fi"]',
  );
  assert.equal(getShowtimesGenres([], '').length, 0);
});
