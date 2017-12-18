var parseDuration = require('parse-duration');
require('datejs');


class TimeInterval {
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
TimeInterval.fromDurationString = function (durationString = '', startTime) {
  var st;
  if (startTime !== undefined) {
    st = Date.parse(startTime);
  }
  return new TimeInterval(parseDuration(durationString), st);
}

function toS(o) {
  if (o === undefined) {
    return '';
  } else {
    return o;
  }
}
TimeInterval.fromString = function (string, startTime) {
  const timeIntervalPattern = /^(.*\s)?(\d+:?\d*[ap]?\.?m?\.?)\s*(to|-)\s*(.*\s)?(\d+:?\d*[ap]?\.?m?\.?)$/i;
  const result = timeIntervalPattern.exec(string);
  if (result) {
    const parsedStartTime = Date.parse(`${toS(result[1])} ${toS(result[2])}`);
    var endDate = result[4];
    if (endDate === undefined) {
      endDate = parsedStartTime.toString('MMM d, yyyy');
    }
    const endTime = Date.parse(`${endDate} ${toS(result[5])}`);
    var duration = endTime - parsedStartTime;
    if (duration < 0) {
      duration += 24 * 60 * 60 * 1000;
    }
    return new TimeInterval(duration, parsedStartTime);
  } else {
    return TimeInterval.fromDurationString(string, startTime);
  }
}
module.exports = TimeInterval;