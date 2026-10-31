// Exercise the extracted hooks and presentation rules without a browser or server.
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('../src/frontend/node_modules/typescript');

function load(file, imports = {}, globals = {}) {
  const source = readFileSync(
    path.join(__dirname, '../src/frontend/src/features/booking', file),
    'utf8',
  );
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const exports = {};
  vm.runInNewContext(
    outputText,
    {
      exports,
      require(name) {
        assert.ok(name in imports, `Unmocked import: ${name}`);
        return imports[name];
      },
      ...globals,
    },
    { filename: file },
  );
  return exports;
}

function hooks() {
  const slots = [];
  let cursor = 0;
  return {
    render(render) {
      cursor = 0;
      return render();
    },
    react: {
      useState(initial) {
        const slot = cursor++;
        if (!(slot in slots))
          slots[slot] = typeof initial === 'function' ? initial() : initial;
        return [
          slots[slot],
          (value) => {
            slots[slot] =
              typeof value === 'function' ? value(slots[slot]) : value;
          },
        ];
      },
      useRef(initial) {
        const slot = cursor++;
        if (!(slot in slots)) slots[slot] = { current: initial };
        return slots[slot];
      },
      useEffect() {},
    },
  };
}

class BookingError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function checkout(confirmBooking) {
  const runtime = hooks();
  const navigations = [],
    cache = [],
    invalidations = [],
    conflicts = [];
  let id = 0;
  const { useCheckout } = load(
    'hooks/useCheckout.ts',
    {
      react: runtime.react,
      '@tanstack/react-query': {
        useQueryClient: () => ({
          setQueryData: (...args) => cache.push(args),
          invalidateQueries: async (args) => invalidations.push(args),
        }),
      },
      'react-router-dom': {
        useNavigate:
          () =>
          (...args) =>
            navigations.push(args),
      },
      '../api/bookingQueries': { BookingError, confirmBooking },
      '../../auth/hooks/useAuth': {
        useAuth: () => ({ customer: null, loading: false, error: '' }),
      },
      '../model/bookingDraft': { saveBookingDraft() {} },
    },
    { crypto: { randomUUID: () => `request-${++id}` } },
  );
  const props = {
    showtimeId: 42,
    seats: [{ id: 7 }, { id: 8 }],
    isOpen: true,
    onConflict: async (message) => conflicts.push(message),
  };
  return {
    props,
    navigations,
    cache,
    invalidations,
    conflicts,
    render: () => runtime.render(() => useCheckout(props)),
  };
}

const event = { preventDefault() {} };

test('uncertain retry preserves request identity, email and seats even after showtime closes', async () => {
  const requests = [];
  const confirmation = { confirmationToken: 'private-token' };
  const flow = checkout(async (showtimeId, request) => {
    requests.push({ showtimeId, request });
    if (requests.length === 1) throw new Error('Connection lost');
    return confirmation;
  });
  flow.render().onEmailChange(' guest@example.com ');
  await flow.render().onSubmit(event);
  flow.props.isOpen = false;
  flow.props.seats = [{ id: 99 }];
  let state = flow.render();
  assert.equal(state.inputsDisabled, true);
  assert.equal(state.submitDisabled, false);
  assert.equal(state.submitLabel, 'Retry confirmation');
  await state.onSubmit(event);
  assert.equal(requests.length, 2);
  assert.equal(requests[0].request, requests[1].request);
  assert.equal(requests[1].showtimeId, 42);
  assert.equal(requests[1].request.email, 'guest@example.com');
  assert.deepEqual(Array.from(requests[1].request.seatIds), [7, 8]);
  assert.equal(flow.cache[0][1], confirmation);
  assert.deepEqual(Array.from(flow.invalidations[0].queryKey), [
    'seat-map',
    '42',
  ]);
  assert.equal(flow.navigations[0][0], '/booking/confirmation/private-token');
  assert.equal(flow.navigations[0][1].replace, true);
});

test('concurrent submission is guarded synchronously before rerender', async () => {
  let release,
    calls = 0;
  const flow = checkout(() => {
    calls++;
    return new Promise((resolve) => {
      release = resolve;
    });
  });
  const state = flow.render();
  const pending = state.onSubmit(event);
  await state.onSubmit(event);
  assert.equal(calls, 1);
  assert.equal(flow.render().pending, true);
  release({ confirmationToken: 'done' });
  await pending;
  assert.equal(flow.render().pending, false);
});

test('closed showtime blocks a new attempt', async () => {
  let calls = 0;
  const flow = checkout(async () => {
    calls++;
  });
  flow.props.isOpen = false;
  assert.equal(flow.render().submitDisabled, true);
  await flow.render().onSubmit(event);
  assert.equal(calls, 0);
});

for (const [status, code] of [
  [409, 'seats_taken'],
  [409, 'showtime_started'],
  [404, ''],
]) {
  test(`booking conflict ${status}/${code} returns to selection without navigating`, async () => {
    const flow = checkout(async () => {
      throw new BookingError(status, code, 'Select again');
    });
    await flow.render().onSubmit(event);
    assert.deepEqual(flow.conflicts, ['Select again']);
    assert.equal(flow.render().inputsDisabled, false);
    assert.equal(flow.navigations.length, 0);
  });
}

test('validation failure permits a changed payload with a fresh request ID', async () => {
  const requests = [];
  const flow = checkout(async (_, request) => {
    requests.push(request);
    throw new BookingError(400, 'invalid_email', 'Invalid email');
  });
  flow.render().onEmailChange('bad');
  await flow.render().onSubmit(event);
  assert.equal(flow.render().error, 'Invalid email');
  flow.render().onEmailChange('correct@example.com');
  await flow.render().onSubmit(event);
  assert.notEqual(requests[0].requestId, requests[1].requestId);
  assert.equal(requests[1].email, 'correct@example.com');
});

const presentation = load('model/bookingPresentation.ts');
test('seat flags permit deselection at the limit and block taken, excess and closed seats', () => {
  const seats = Array.from({ length: 10 }, (_, id) => ({
    id,
    taken: id === 9,
  }));
  const selected = seats.slice(0, presentation.MAX_SEATS);
  const prepared = presentation.prepareSeats(seats, selected, true);
  assert.equal(prepared[0].selected, true);
  assert.equal(prepared[0].disabled, false);
  assert.equal(prepared[8].disabled, true);
  assert.equal(prepared[9].disabled, true);
  assert.equal(
    presentation.prepareSeats(seats, [], false).every((seat) => seat.disabled),
    true,
  );
  assert.equal('selected' in seats[0], false);
});

test('conflict recovery clears selection, refreshes availability, then exits checkout', async () => {
  const runtime = hooks();
  const calls = [];
  let completeRefresh;
  const { useBookingPage } = load('hooks/useBookingPage.ts', {
    react: runtime.react,
    '../model/bookingDraft': {
      readBookingDraft: () => null,
      saveBookingDraft() {},
    },
    '@tanstack/react-query': {
      useQuery: () => ({ data: map }),
      useQueryClient: () => ({
        invalidateQueries: (options) => {
          calls.push(options);
          return new Promise((resolve) => {
            completeRefresh = resolve;
          });
        },
      }),
    },
    './useSeatSelection': {
      useSeatSelection: () => ({
        selectedSeats: [{ id: 7 }],
        isOpen: true,
        toggle() {},
        clear: () => calls.push('clear'),
      }),
    },
    '../model/bookingPresentation': presentation,
    '../api/bookingQueries': {
      bookingQueries: { seats: () => ({}) },
      SeatMapError: class extends Error {},
    },
    './useCheckout': {
      useCheckout: ({ onConflict }) => ({
        reset: () => calls.push('reset'),
        onConflict,
      }),
    },
  });
  const map = { showtimeId: 42, startsAt: '2026-10-28T12:00:00Z', seats: [] };
  const render = () => runtime.render(() => useBookingPage('42'));
  render().beginCheckout();
  assert.equal(render().checkoutSeats[0].id, 7);
  calls.length = 0;
  const recovery = render().checkout.onConflict?.('Seat no longer available');
  assert.equal(render().notice, 'Seat no longer available');
  assert.equal(calls[0], 'clear');
  assert.deepEqual(Array.from(calls[1].queryKey), ['seat-map', '42']);
  assert.ok(
    render().checkoutSeats,
    'Checkout remains until the refresh settles',
  );
  completeRefresh();
  await recovery;
  assert.equal(render().checkoutSeats, null);
});

test('returning to selection resets checkout before a new seat choice', async () => {
  const requests = [];
  const flow = checkout(async (_, request) => {
    requests.push(request);
    throw new BookingError(400, 'invalid_email', 'Invalid email');
  });
  flow.render().onEmailChange('old@example.com');
  await flow.render().onSubmit(event);
  flow.render().reset();
  flow.props.seats = [{ id: 9 }];
  const fresh = flow.render();
  assert.equal(fresh.email, '');
  assert.equal(fresh.error, '');
  assert.equal(fresh.pending, false);
  fresh.onEmailChange('new@example.com');
  await flow.render().onSubmit(event);
  assert.notEqual(requests[0].requestId, requests[1].requestId);
  assert.equal(requests[1].email, 'new@example.com');
  assert.deepEqual(Array.from(requests[1].seatIds), [9]);
});

test('the page cannot submit while checkout is inactive', async () => {
  let calls = 0;
  const flow = checkout(async () => {
    calls++;
  });
  flow.props.active = false;
  await flow.render().onSubmit(event);
  assert.equal(calls, 0);
});
