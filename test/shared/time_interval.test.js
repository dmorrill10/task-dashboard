'use strict';

const assert = require('assert');
require('datejs');
const TimeInterval = require('../../shared/time_interval');

describe('TimeInterval', function () {
  describe('fromDurationString', function () {
    it('works without argument', function () {
      var patient = TimeInterval.fromDurationString();
      assert.ok(!patient.hasStartTime());
      assert.equal(patient.startTime(), undefined);
      assert.equal(patient.endTime(), undefined);
      assert.equal(patient.durationS(), 0);
    });
    it('works with seconds', function () {
      var patient = TimeInterval.fromDurationString('5 seconds');
      assert.ok(!patient.hasStartTime());
      assert.equal(patient.startTime(), undefined);
      assert.equal(patient.endTime(), undefined);
      assert.equal(patient.durationS(), 5);
    });
    it('works with minutes', function () {
      var patient = TimeInterval.fromDurationString('5 minutes and 2 seconds');
      assert.ok(!patient.hasStartTime());
      assert.equal(patient.startTime(), undefined);
      assert.equal(patient.endTime(), undefined);
      assert.equal(patient.durationS(), 60 * 5 + 2);
    });
    it('works with hours', function () {
      var patient = TimeInterval.fromDurationString('3 hours, 5 minutes, and 2 seconds');
      assert.ok(!patient.hasStartTime());
      assert.equal(patient.startTime(), undefined);
      assert.equal(patient.endTime(), undefined);
      assert.equal(patient.durationS(), 60 * 60 * 3 + 60 * 5 + 2);
    });
    it('works with a start time', function () {
      var patient = TimeInterval.fromDurationString(
        '3 hours, 5 minutes, and 2 seconds',
        '1:21pm'
      );
      assert.ok(patient.hasStartTime());
      assert.equal(patient.startTime().toLocaleTimeString(), '1:21:00 p.m.');
      assert.ok(Date.parse('13:21').equals(patient.startTime()));
      assert.equal(patient.endTime().toLocaleTimeString(), '4:26:02 p.m.');
      assert.ok(Date.parse('16:26:02').equals(patient.endTime()));
      assert.equal(patient.durationS(), 60 * 60 * 3 + 60 * 5 + 2);
    });
    it('works with a start date', function () {
      var patient = TimeInterval.fromDurationString(
        '3 hours, 5 minutes, and 2 seconds',
        'Dec 17, 2017 11:21pm'
      );
      assert.ok(patient.hasStartTime());
      assert.equal(patient.startTime().toLocaleTimeString(), '11:21:00 p.m.');
      assert.ok(Date.parse('Dec 17, 2017 at 23:21').equals(patient.startTime()));
      assert.equal(patient.endTime().toLocaleTimeString(), '2:26:02 a.m.');
      assert.ok(Date.parse('Dec 18, 2017 at 2:26:02').equals(patient.endTime()));
      assert.equal(patient.durationS(), 60 * 60 * 3 + 60 * 5 + 2);
    });
  });
  describe('fromString', function () {
    it('works without a date', function () {
      var patient = TimeInterval.fromString('11:21pm to 2:26am');
      assert.ok(patient.hasStartTime());
      assert.equal(patient.startTime().toLocaleTimeString(), '11:21:00 p.m.');
      assert.ok(Date.parse('Dec 17, 2017 at 23:21').equals(patient.startTime()));
      assert.equal(patient.endTime().toLocaleTimeString(), '2:26:00 a.m.');
      assert.ok(Date.parse('Dec 18, 2017 at 02:26').equals(patient.endTime()));
      assert.equal(patient.durationS(), 60 * 60 * 3 + 60 * 5);
    });
  });
});