'use strict';

const assert = require('assert');
require('datejs');
const TimeInterval = require('../../shared/time_interval');

describe('TimeInterval', function () {
  describe('fromDurationString', function () {
    it('works without argument', function () {
      var patient = TimeInterval.fromDurationString();
      assert.ok(!patient.hasStartTime());
      assert.strictEqual(patient.startTime(), undefined);
      assert.strictEqual(patient.endTime(), undefined);
      assert.strictEqual(patient.durationS(), 0);
    });
    it('works with seconds', function () {
      var patient = TimeInterval.fromDurationString('5 seconds');
      assert.ok(!patient.hasStartTime());
      assert.strictEqual(patient.startTime(), undefined);
      assert.strictEqual(patient.endTime(), undefined);
      assert.strictEqual(patient.durationS(), 5);
    });
    it('works with minutes', function () {
      var patient = TimeInterval.fromDurationString('5 minutes and 2 seconds');
      assert.ok(!patient.hasStartTime());
      assert.strictEqual(patient.startTime(), undefined);
      assert.strictEqual(patient.endTime(), undefined);
      assert.strictEqual(patient.durationS(), 60 * 5 + 2);
    });
    it('works with hours', function () {
      var patient = TimeInterval.fromDurationString('3 hours, 5 minutes, and 2 seconds');
      assert.ok(!patient.hasStartTime());
      assert.strictEqual(patient.startTime(), undefined);
      assert.strictEqual(patient.endTime(), undefined);
      assert.strictEqual(patient.durationS(), 60 * 60 * 3 + 60 * 5 + 2);
    });
    it('works with a start time', function () {
      var patient = TimeInterval.fromDurationString(
        '3 hours, 5 minutes, and 2 seconds',
        '1:21pm'
      );
      assert.ok(patient.hasStartTime());
      assert.strictEqual('1:21:00 PM', patient.startTime().toLocaleTimeString());
      assert.ok(Date.parse('13:21').equals(patient.startTime()));
      assert.strictEqual('4:26:02 PM', patient.endTime().toLocaleTimeString());
      assert.ok(Date.parse('16:26:02').equals(patient.endTime()));
      assert.strictEqual(patient.durationS(), 60 * 60 * 3 + 60 * 5 + 2);
    });
    it('works with a start date', function () {
      var patient = TimeInterval.fromDurationString(
        '3 hours, 5 minutes, and 2 seconds',
        'Dec 17, 2017 11:21pm'
      );
      assert.ok(patient.hasStartTime());
      assert.strictEqual('11:21:00 PM', patient.startTime().toLocaleTimeString());
      assert.ok(Date.parse('Dec 17, 2017 at 23:21').equals(patient.startTime()));
      assert.strictEqual('2:26:02 AM', patient.endTime().toLocaleTimeString());
      assert.ok(Date.parse('Dec 18, 2017 at 2:26:02').equals(patient.endTime()));
      assert.strictEqual(patient.durationS(), 60 * 60 * 3 + 60 * 5 + 2);
    });
  });
  describe('fromIntervalString', function () {
    it('works without a date', function () {
      var patient = TimeInterval.fromIntervalString('11:21pm to 2:26am');
      assert.ok(patient.hasStartTime());
      assert.strictEqual('11:21:00 PM', patient.startTime().toLocaleTimeString());
      assert.strictEqual('2:26:00 AM', patient.endTime().toLocaleTimeString());
      assert.strictEqual(patient.durationS(), 60 * 60 * 3 + 60 * 5);
    });
    it('works with a date', function () {
      var patient = TimeInterval.fromIntervalString('11:21pm to 2:26am', 'Dec 17, 2017');
      assert.ok(patient.hasStartTime());
      assert.strictEqual('11:21:00 PM', patient.startTime().toLocaleTimeString());
      assert.ok(Date.parse('Dec 17, 2017 at 23:21').equals(patient.startTime()));
      assert.strictEqual('2:26:00 AM', patient.endTime().toLocaleTimeString());
      assert.ok(Date.parse('Dec 18, 2017 at 02:26').equals(patient.endTime()));
      assert.strictEqual(patient.durationS(), 60 * 60 * 3 + 60 * 5);
    });
    it('works on "8:52am to 12:59pm"', function () {
      let interval = TimeInterval.fromIntervalString('8:52am to 12:59pm');
      assert.ok(interval.hasStartTime());
      assert.strictEqual('8:52:00 AM', interval.startTime().toLocaleTimeString());
      assert.strictEqual('12:59:00 PM', interval.endTime().toLocaleTimeString());
      assert.strictEqual(interval.durationS(), 60 * 60 * 4 + 60 * 7);
    });
    it('works on "11:31pm to 12:47am"', function () {
      let interval = TimeInterval.fromIntervalString('11:31pm to 12:47am');
      assert.ok(interval.hasStartTime());
      assert.strictEqual('11:31:00 PM', interval.startTime().toLocaleTimeString());
      assert.strictEqual('12:47:00 AM', interval.endTime().toLocaleTimeString());
      assert.strictEqual(interval.durationS(), 60 * 60 * 1 + 60 * 16);
    });
  });
});