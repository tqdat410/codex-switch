import assert from 'node:assert/strict';
import test from 'node:test';
import { shouldUseDefaultLaunch } from '../src/core/default-routing.js';

test('routes bare cs and Codex flags to default launch', () => {
  assert.equal(shouldUseDefaultLaunch([]), true);
  assert.equal(shouldUseDefaultLaunch(['--model', 'gpt-5.5']), true);
  assert.equal(shouldUseDefaultLaunch(['exec', '--json', 'say ok']), true);
});

test('keeps codex-switch commands inside commander', () => {
  assert.equal(shouldUseDefaultLaunch(['status', '--json']), false);
  assert.equal(shouldUseDefaultLaunch(['auto', 'off']), false);
  assert.equal(shouldUseDefaultLaunch(['use', 'personal']), false);
  assert.equal(shouldUseDefaultLaunch(['--help']), false);
});
