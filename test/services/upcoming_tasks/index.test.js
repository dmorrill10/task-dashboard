'use strict';

const assert = require('assert');
const app = require('../../../src/app');

describe('upcoming_tasks service', function() {
  it('registered the upcoming_tasks service', () => {
    assert.ok(app.service('upcoming_tasks'));
  });
});
