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
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    require(name) {
      assert.ok(name in imports, `Unmocked import: ${name}`);
      return imports[name];
    },
    ...globals,
  }, { filename: file });
  return exports;
}

function environment() {
  const window = new EventTarget();
  window.scrollY = 0;
  window.scrollTo = ({ top }) => { window.scrollY = top; };
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
      requestAnimationFrame(callback) { frames.set(++id, callback); return id; },
      cancelAnimationFrame(frame) { frames.delete(frame); },
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

const { lockPageScroll } = load('shared/hooks/usePageScrollLock.ts', { react: {} });
const geometry = load('features/cinema-entrance/journeyGeometry.ts');

function journey(reduced = false) {
  const env = environment();
  const style = new Map();
  const html = { style: { overflow: '', scrollbarGutter: '' } };
  const controls = { inert: false };
  const root = {
    style: { setProperty: (key, value) => style.set(key, value) },
    querySelectorAll: () => [controls],
  };
  const stage = { clientWidth: 1000, clientHeight: 1000, offsetHeight: 1000 };
  const room = {
    offsetHeight: reduced ? 1000 : 3000,
    getBoundingClientRect: () => ({ top: -env.window.scrollY }),
  };
  const schedule = {
    getBoundingClientRect: () => ({ top: room.offsetHeight - (reduced ? 0 : stage.offsetHeight) - env.window.scrollY }),
    setAttribute() {}, removeAttribute() {},
  };
  const refs = [root, room, stage, schedule];
  const effects = [];
  const events = [];
  let unlock;
  const media = new EventTarget();
  media.matches = reduced;
  const { useCinemaJourney } = load('features/cinema-entrance/hooks/useCinemaJourney.ts', {
    react: {
      useRef: () => ({ current: refs.shift() }),
      useLayoutEffect: (effect) => effects.push(effect),
    },
    '../journeyGeometry': geometry,
  }, {
    ...env.globals,
    matchMedia: () => media,
    ResizeObserver: class { observe() {} disconnect() {} },
  });
  useCinemaJourney(
    (offset) => events.push(['complete', offset]),
    () => events.push(['reveal']),
    () => { events.push(['lock']); unlock = lockPageScroll(html, env.window); },
  );
  const cleanup = effects[0]();
  env.flush();
  return {
    ...env, events, style, html,
    scroll(y) { env.window.scrollY = y; env.window.dispatchEvent(new Event('scroll')); },
    dispose() { cleanup(); unlock?.(); },
  };
}

for (const position of [1760, 2450]) {
  test(`arrival pins before reveal, including overshoot from ${position}px`, () => {
    const scene = journey();
    scene.scroll(1700);
    scene.flush();
    assert.deepEqual(scene.events, []);
    assert.equal(scene.style.get('--schedule-opacity'), '0');
    scene.scroll(position);
    assert.deepEqual(scene.events, [['lock']]);
    assert.equal(scene.html.style.overflow, 'hidden');
    assert.equal(scene.window.scrollY, 2000);
    scene.flush();
    assert.deepEqual(scene.events, [['lock'], ['reveal'], ['complete', 0]]);
    assert.equal(scene.style.get('--schedule-opacity'), '1');
    const wheel = new Event('wheel', { cancelable: true });
    scene.window.dispatchEvent(wheel);
    assert.equal(wheel.defaultPrevented, true, 'Hold must survive camera completion');
    scene.dispose();
    assert.equal(scene.html.style.overflow, '');
  });
}

test('scroll can reverse before the reveal boundary without acquiring a hold', () => {
  const scene = journey();
  scene.scroll(1700);
  scene.flush();
  scene.scroll(600);
  scene.flush();
  assert.deepEqual(scene.events, []);
  assert.equal(scene.window.scrollY, 600);
  scene.dispose();
});

test('reduced motion pins and hands off when the schedule first enters view', () => {
  const scene = journey(true);
  scene.scroll(10);
  assert.deepEqual(scene.events, [['lock'], ['reveal'], ['complete', 0]]);
  assert.equal(scene.window.scrollY, 1000);
  scene.dispose();
});

test('navigation acquires its lock synchronously and keeps it through handoff', () => {
  const env = environment();
  const html = { style: { overflow: 'auto', scrollbarGutter: '' } };
  const navigations = [];
  const { useAppNavigation } = load('app/hooks/useAppNavigation.ts', {
    react: {
      useRef: (current) => ({ current }),
      useState: (init) => [init()],
      useCallback: (callback) => callback,
      useLayoutEffect() {},
    },
    'react-router-dom': { useLocation: () => ({ pathname: '/' }), useNavigate: () => (url) => navigations.push(url) },
    '../../features/schedule': { createScheduleMotionSession: () => ({}) },
    '../../shared/hooks/usePageScrollLock': { lockPageScroll },
  }, { window: env.window, document: { documentElement: html } });
  const navigation = useAppNavigation();
  navigation.beginArrival();
  navigation.beginArrival();
  assert.equal(html.style.overflow, 'hidden');
  navigation.completeEntrance(0);
  assert.deepEqual(navigations, ['/schedule']);
  assert.equal(html.style.overflow, 'hidden');
  navigation.releaseArrival();
  assert.equal(html.style.overflow, 'auto');
  const wheel = new Event('wheel', { cancelable: true });
  env.window.dispatchEvent(wheel);
  assert.equal(wheel.defaultPrevented, false);
});

test('schedule readiness waits for data and entrance effects before releasing', async () => {
  const env = environment();
  let effect;
  let ready = 0;
  let finish;
  const finished = new Promise((resolve) => { finish = resolve; });
  const root = { current: { querySelectorAll: () => [{ getAnimations: () => [{ finished }] }] } };
  const { useScheduleReady } = load('features/schedule/hooks/useScheduleReady.ts', {
    react: { useLayoutEffect: (callback) => { effect = callback; } },
  }, env.globals);
  useScheduleReady(root, true, () => { ready++; });
  effect();
  assert.equal(env.frames.size, 0, 'Pending data must keep the hold');
  useScheduleReady(root, false, () => { ready++; });
  const cleanup = effect();
  env.flush();
  await new Promise(setImmediate);
  assert.equal(ready, 0, 'Unfinished entrance effects must keep the hold');
  finish();
  await new Promise(setImmediate);
  assert.equal(ready, 1);
  cleanup();
});
