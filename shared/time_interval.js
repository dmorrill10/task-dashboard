var parseDuration = require('parse-duration');
require('datejs');


function toS(o) {
  if (o === undefined) {
    return '';
  } else {
    return o;
  }
}


class TimeInterval {
  static fromDurationString(durationString = '', startTime) {
    var st;
    if (startTime !== undefined) {
      st = Date.parse(startTime);
    }
    return new this(parseDuration(durationString), st);
  }

  static isIntervalString(s) {
    return this.pattern.exec(string) !== null;
  }

  static fromIntervalString(string, optionalStartDate) {
    const result = this.pattern.exec(string);
    if (result) {
      var startDate = result[1];
      if (startDate === undefined) {
        startDate = optionalStartDate;
      }
      const parsedStartTime = Date.parse(`${toS(startDate)} ${result[2]}`);

      var endDate = result[4];
      if (endDate === undefined) {
        endDate = parsedStartTime.toString('MMM d, yyyy');
      }
      const endTime = Date.parse(`${endDate} ${result[5]}`);

      var duration = endTime - parsedStartTime;
      if (duration < 0) {
        duration += 24 * 60 * 60 * 1000;
      }
      return new this(duration, parsedStartTime);
    }
    return null;
  }

  constructor(durationMs = 0, startTime) {
    this._durationMs = durationMs;
    this._startTime = startTime;
    this._endTime = (
      startTime === undefined || startTime === null ?
      undefined :
      startTime.clone().addMilliseconds(durationMs)
    );
  }

  hasStartTime() {
    return this._startTime !== undefined && this._startTime !== null;
  }
  durationS() {
    return this._durationMs / 1.0e3;
  }
  startTime() {
    return this._startTime;
  }
  endTime() {
    return this._endTime;
  }
};
TimeInterval.pattern = /^(.*\s)?(\d+:?\d*[ap]?\.?m?\.?)\s*(to|-)\s*(.*\s)?(\d+:?\d*[ap]?\.?m?\.?)$/i;

module.exports = TimeInterval;