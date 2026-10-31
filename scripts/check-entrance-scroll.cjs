// Exercise the actual hooks with a deterministic scroll/animation-frame environment.
// No browser, server, or additional test dependencies are required.
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('../src/frontend/node_modules/typescript');
const sourceRoot = path.join(__dirname, '../src/frontend/src');

function load(file, imports = {}, globals = {}) {
  const source = readFileSync(path.join(sourceRoot, file), 'utf8');
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

function environment() {
  const window = new EventTarget();

  window.scrollY = 0;
  window.scrollTo = ({ top }) => {
    window.scrollY = top;
  };

  const frames = new Map();
  let id = 0;
  let time = 0;

  return {
    window,
    frames,
    globals: {
      window,
      addEventListener: window.addEventListener.bind(window),
      removeEventListener: window.removeEventListener.bind(window),
      requestAnimationFrame(callback) {
        frames.set(++id, callback);

        return id;
      },
      cancelAnimationFrame(frame) {
        frames.delete(frame);
      },
    },
    flush() {
      let remaining = 200;

      while (frames.size) {
        assert.ok(remaining-- > 0, 'Animation failed to settle');

        const callbacks = [...frames.values()];

        frames.clear();
        time += 16;
        callbacks.forEach((callback) => callback(time));
      }
    },
  };
}

const geometry = load('features/cinema-entrance/journeyGeometry.ts');

function journey(reduced = false) {
  const env = environment();
  const style = new Map();
  const controls = { inert: false };
  const root = {
    style: { setProperty: (key, value) => style.set(key, value) },
    querySelectorAll: () => [controls],
  };
  const stage = { clientWidth: 1000, clientHeight: 1000, offsetHeight: 1000 };
  const room = {
    offsetHeight: reduced ? 1100 : 3000,
    getBoundingClientRect: () => ({ top: -env.window.scrollY }),
  };
  const refs = [root, room, stage];
  const effects = [];
  const events = [];
  const media = new EventTarget();

  media.matches = reduced;

  const { useCinemaJourney } = load(
    'features/cinema-entrance/hooks/useCinemaJourney.ts',
    {
      react: {
        useRef: () => ({ current: refs.shift() }),
        useLayoutEffect: (effect) => effects.push(effect),
      },
      '../journeyGeometry': geometry,
    },
    {
      ...env.globals,
      matchMedia: () => media,
      ResizeObserver: class {
        observe() {}
        disconnect() {}
      },
    },
  );

  useCinemaJourney(() => events.push('complete'));

  const cleanup = effects[0]();

  env.flush();

  return {
    ...env,
    events,
    style,
    scroll(y) {
      env.window.scrollY = y;
      env.window.dispatchEvent(new Event('scroll'));
    },
    dispose: cleanup,
  };
}

for (const position of [1999.5, 2000, 2450]) {
  test(
    'navigates once at the end, including scroll overshoot ' + position,
    () => {
      const scene = journey();

      scene.scroll(1760);
      scene.flush();
      assert.deepEqual(scene.events, []);
      scene.scroll(position);
      scene.flush();
      assert.deepEqual(scene.events, ['complete']);
      assert.equal(scene.style.get('--travel'), '1');
      scene.scroll(position);
      scene.flush();
      assert.deepEqual(scene.events, ['complete']);
      scene.dispose();
    },
  );
}

test('scroll can reverse before reaching the end', () => {
  const scene = journey();

  scene.scroll(1700);
  scene.flush();
  scene.scroll(0);
  scene.flush();
  assert.deepEqual(scene.events, []);
  assert.equal(scene.style.get('--travel'), '0');
  scene.dispose();
});

test('reduced motion navigates at the bottom without zooming', () => {
  const scene = journey(true);

  scene.scroll(50);
  assert.deepEqual(scene.events, []);
  scene.scroll(100);
  assert.deepEqual(scene.events, ['complete']);
  assert.equal(scene.style.get('--travel'), '0');
  scene.dispose();
});

test('unmount cancels an unfinished entrance', () => {
  const scene = journey();

  scene.scroll(2000);
  scene.dispose();
  scene.flush();
  assert.deepEqual(scene.events, []);
});

test('entrance navigation preserves URL filters', () => {
  const navigations = [];
  const { useAppNavigation } = load('app/hooks/useAppNavigation.ts', {
    react: {
      useRef: (current) => ({ current }),
      useCallback: (callback) => callback,
      useLayoutEffect() {},
    },
    'react-router-dom': {
      useLocation: () => ({
        pathname: '/',
        search: '?genre=Sci-Fi&format=IMAX+3D',
      }),
      useNavigate: () => (url) => navigations.push(url),
    },
  });

  useAppNavigation().completeEntrance();
  assert.deepEqual(navigations, ['/showtimes?genre=Sci-Fi&format=IMAX+3D']);
});
