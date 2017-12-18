'use strict';

const assert = require('assert');
const app = require('../../../src/app');

describe('past_tasks service', function() {
  it('registered the past_tasks service', () => {
    assert.ok(app.service('past_tasks'));
  });
});
