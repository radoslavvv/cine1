import test from 'node:test';
import assert from 'node:assert/strict';
import { createScheduleMotionSession } from '../src/features/schedule/model/scheduleMotion.ts';

test('a hidden auditorium preview waits until the schedule opens', () => {
  const motion = createScheduleMotionSession(() => 100);
  assert.equal(motion.startFor('title', 60), null);
  motion.start();
  assert.equal(motion.startFor('title', 60), 160);
});

test('route remounts and refreshes preserve scheduled animation timestamps', () => {
  let clock = 100;
  const motion = createScheduleMotionSession(() => clock);
  motion.start();
  const original = motion.startFor('row:1', 320);
  clock = 650;
  motion.start();
  assert.equal(motion.startFor('row:1', 320), original);
  clock = 5_000;
  assert.equal(motion.startFor('row:1', 320), original);
});

test('late movie data gets a current start rather than an already-finished entrance', () => {
  let clock = 100;
  const motion = createScheduleMotionSession(() => clock);
  motion.start();
  clock = 5_000;
  assert.equal(motion.startFor('row:2', 385), 5_000);
});

test('returning home resets the entrance for a new visit', () => {
  let clock = 100;
  const motion = createScheduleMotionSession(() => clock);
  motion.start();
  assert.equal(motion.startFor('header', 0), 100);
  motion.reset();
  assert.equal(motion.startFor('header', 0), null);
  clock = 2_000;
  motion.start();
  assert.equal(motion.startFor('header', 0), 2_000);
});

test('preview subscribers are notified once per opening and detached on unmount', () => {
  const motion = createScheduleMotionSession(() => 100);
  let calls = 0;
  const unsubscribe = motion.subscribe(() => calls++);
  motion.start();
  motion.start();
  assert.equal(calls, 1);
  unsubscribe();
  motion.reset();
  assert.equal(calls, 1);
});
