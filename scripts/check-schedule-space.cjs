const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('../src/frontend/node_modules/typescript');

function resultsSpace() {
  let bounds = { width: 1000, height: 4500 };
  const content = { getBoundingClientRect: () => bounds };
  const refs = [];
  let refIndex = 0;
  let height = 0;
  let dependencies;
  let cleanup;
  let notify;
  const source = readFileSync(
    path.join(
      __dirname,
      '../src/frontend/src/features/schedule/hooks/useResultsSpace.ts',
    ),
    'utf8',
  );
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    require: () => ({
      useRef(initial) {
        const index = refIndex++;
        return (refs[index] ??= { current: index === 0 ? content : initial });
      },
      useState: () => [
        height,
        (update) => {
          height = update(height);
        },
      ],
      useLayoutEffect(effect, nextDependencies) {
        if (
          !dependencies ||
          nextDependencies.some((value, index) => value !== dependencies[index])
        ) {
          cleanup?.();
          dependencies = nextDependencies;
          cleanup = effect();
        }
      },
    }),
    ResizeObserver: class {
      constructor(callback) {
        notify = callback;
      }
      observe() {
        notify();
      }
      disconnect() {}
    },
  });
  return {
    render(pending) {
      refIndex = 0;
      exports.useResultsSpace(pending);
    },
    resize(nextHeight) {
      bounds = { ...bounds, height: nextHeight };
      notify();
    },
    get height() {
      return height;
    },
  };
}

test('settled filtered results release blank space from a longer movie list', () => {
  const space = resultsSpace();
  space.render(false);
  assert.equal(space.height, 4500);
  space.resize(1500);
  assert.equal(
    space.height,
    1500,
    'The footer must follow the current results, without 3000px of blank space',
  );
});

test('loading preserves the previous footprint, then releases it when results settle', () => {
  const space = resultsSpace();
  space.render(false);
  space.render(true);
  space.resize(600);
  assert.equal(
    space.height,
    4500,
    'Loading skeletons must not collapse the page',
  );
  space.resize(1500);
  space.render(false);
  assert.equal(space.height, 1500);
});
