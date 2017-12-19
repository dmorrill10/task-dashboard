require('jquery');
require('jquery-ujs');
require('./style/index.sass');
require('bootstrap-sass/assets/javascripts/bootstrap.min.js');
const TimeInterval = require('../shared/time_interval');

import io from 'socket.io-client';
import feathers from 'feathers/client';
import socketio from 'feathers-socketio/client';

import React from 'react';
import ReactDOM from 'react-dom';
import Communicator from './src/communicator';


function afterRender(selector, f) {
  const elem = $(selector);
  if (elem && elem.length) {
    return f();
  } else {
    return window.requestAnimationFrame(() => {
      return afterRender(selector, f);
    });
  }
}

function afterHasSize(selector, f) {
  const elem = $(selector);
  if (elem && elem.length && elem.height() > 0.0 && elem.width() > 0.0) {
    return f();
  } else {
    return window.requestAnimationFrame(() => {
      return afterHasSize(selector, f);
    });
  }
}

const hooks = require('feathers-hooks');

// Create a client side Feathers application that uses the socket for connecting
// to services
let app = feathers();
app.configure(socketio(io('/'))).configure(hooks());
let communicator = new Communicator(app);

import ReactJson from 'react-json-view'

function constructTasks(data) {
  var tasks = [];
  var endTime;
  for (const day of data) {
    endTime = day.date;
    for (const task of day.tasks) {
      var duration;
      if (TimeInterval.isIntervalString(task.duration)) {
        duration = TimeInterval.fromIntervalString(task.duration, day.date);
      } else {
        duration = TimeInterval.fromDurationString(task.duration, endTime);
      }
      endTime = duration.endTime();
      tasks.push({duration: duration, subject: task.subject, description: task.description});
    }
  }
  tasks.reverse();
  return tasks;
}

function durationSumH(tasks) {
  return tasks.reduce((sum, t) => sum + t.duration.durationH(), 0);
}

function durationHBySubject(tasks) {
  var durationSums = {};
  for (const t of tasks) {
    if (!(t.subject in durationSums)) {
      durationSums[t.subject] = 0;
    }
    durationSums[t.subject] += t.duration.durationH();
  }
  return durationSums;
}

function descriptionsBySubject(tasks) {
  var descriptions = {};
  for (const t of tasks) {
    if (!(t.subject in descriptions)) {
      descriptions[t.subject] = [];
    }
    descriptions[t.subject].push({
      time: `${t.duration.startTime().toString('MMM d, yy')} at ${t.duration.startTime().toString('HH:mm')}`,
      desc: t.description
    });
  }
  return descriptions;
}

const marked = require('marked');

function main() {
  return communicator.findPastTasks().then(function (data) {
    const tasks = constructTasks(data);

    var weekSummaries = {};
    var weekEnd = Date.today();
    var weekStart = weekEnd.clone().last().sunday();
    var week = 0;
    weekSummaries[weekStart.toString('MMM d, yy')] = {weeksAgo: week};
    var thisWeeksTasks = [];
    for (const task of tasks) {
      if (task.duration.startTime() < weekStart) {
        weekSummaries[weekStart.toString('MMM d, yy')]['hours'] = durationHBySubject(thisWeeksTasks);
        weekSummaries[weekStart.toString('MMM d, yy')]['descriptions'] = descriptionsBySubject(thisWeeksTasks);
        thisWeeksTasks = [];
        weekEnd = weekStart;
        weekStart = weekStart.clone().last().sunday();
        week += 1;
        weekSummaries[weekStart.toString('MMM d, yy')] = {weeksAgo: week};
      }
      if (task.duration.startTime() >= weekStart && task.duration.startTime() < weekEnd) {
        thisWeeksTasks.push(task);
      }
    }
    weekSummaries[weekStart.toString('MMM d, yy')]['hours'] = durationHBySubject(thisWeeksTasks);
    weekSummaries[weekStart.toString('MMM d, yy')]['descriptions'] = descriptionsBySubject(thisWeeksTasks);
    thisWeeksTasks = [];
    document.getElementById('description').innerHTML = marked(
      `# ${weekSummaries['Dec 10, 17']['descriptions']['cmput609'][14]['time']}\n\n${weekSummaries['Dec 10, 17']['descriptions']['cmput609'][14]['desc']}`);
    return ReactDOM.render(
      <ReactJson src={weekSummaries} />,
      document.getElementById('raw')
    );
  });
}

const loadedStates = ['complete', 'loaded', 'interactive'];
if (loadedStates.includes(document.readyState) && document.body) {
  main();
} else {
  window.addEventListener('DOMContentLoaded', main, false);
}
