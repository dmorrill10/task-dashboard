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


function tasksByWeekAndDay(tasks) {
  let weeks = {}
  for (const task of tasks) {
    const lastSunday = task.duration.startTime().is().sunday() ? task.duration.startTime() : task.duration.startTime().clone().last().sunday();
    const lastSundayString = lastSunday.toString('MMM d, yyyy');
    if (!(lastSundayString in weeks)) {
      weeks[lastSundayString] = {};
      for (const name of Date.CultureInfo.abbreviatedDayNames) {
        weeks[lastSundayString][name] = [];
      }
    }
    weeks[lastSundayString][task.duration.startTime().toString('ddd')].push(task);
  }
  return weeks;
}


class Calendar extends React.Component {
  dayRows() {
    if (Object.keys(this.props.tasks).length < 1) {
      return null;
    }

    let weekStartDate = Date.today().last().sunday();
    let foundFirstWeek = false;
    let weekTotals = [];
    let rows = [];
    while (true) {
      const weekStartDateString = weekStartDate.toString('MMM d, yyyy');
      if (weekStartDateString in this.props.tasks) {
        foundFirstWeek = true;
        let weekTotal = 0.0;
        let row = [<td key={`week-${rows.length}`} className='week'>{weekStartDateString}</td>];
        const days = this.props.tasks[weekStartDateString];
        for (const day of Date.CultureInfo.abbreviatedDayNames) {
          const time = days[day].reduce((sum, task) => sum + task.duration.durationH(), 0.0);
          weekTotal += time;
          row.push(<td key={`${day}-${rows.length}`} className={day}>{Math.round(100 * time) / 100.0}</td>);
        }
        weekTotals.push(weekTotal);
        row.push(<td key={`total-${rows.length}`} className={`total-${rows.length}`}>{Math.round(100 * weekTotal) / 100.0}</td>);
        rows.push(row);
      } else if (foundFirstWeek) {
        break;
      }
      weekStartDate = weekStartDate.last().sunday();
    }
    let avg = 0.0;
    for (let i = rows.length - 1; i >= 0; --i) {
      const numWeeks = rows.length - i - 1;
      avg = (avg * numWeeks + weekTotals[i]) / (numWeeks + 1.0);
      rows[i].push(<td key={`avg-${i}`} className={`avg-${i}`}>{Math.round(100 * avg) / 100.0}</td>);
    }
    let l = [];
    for (let i = 0; i < rows.length; ++i) {
      l.push(<tr key={l.length}>{rows[i]}</tr>);
    }
    return l;
  }
  render() {
    const dayHeaders = Date.CultureInfo.abbreviatedDayNames.map(
      (day) => <th key={`${day}-label`} className={`${day}-label`}>{day}</th>
    );
    return (
      <table className='table table-striped table-responsive'>
        <thead>
          <tr>
            <th key='week-label' className='week-label'>Week</th>
            {dayHeaders}
            <th key='total-label' className='total-label'>Total</th>
            <th key='avg-label' className='avg-label'>Avg</th>
          </tr>
        </thead>
        <tbody>
          {this.dayRows()}
        </tbody>
      </table>
    );
  }
}

const Chart = require('chart.js');
window.Chart = Chart;


function main() {
  return communicator.findPastTasks().then(function (data) {
    const tasks = constructTasks(data);
    const tasksByWeek = tasksByWeekAndDay(tasks);

    const myTasks = tasksByWeek['Dec 10, 2017']['Mon'];
    let hours = {};
    for (const task of myTasks) {
      if (!(task.subject in hours)) {
        hours[task.subject] = 0.0;
      }
      hours[task.subject] += task.duration.durationH();
    }
    const labels = Object.keys(hours);
    let times = []
    for (const label of labels) {
      times.push(hours[label]);
    }

    const ctx = document.getElementById('hours-by-subject').getContext('2d');
    const myChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Dec 11, 2017',
          data: times
        }]
      },
      options: {
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: true
            },
            scaleLabel: {
              labelString: 'Hours',
              display: true
            }
          }]
        }
      }
    });

    return ReactDOM.render(
      <Calendar tasks={tasksByWeek} />,
      document.getElementById('calendar')
    );
  });
}

const loadedStates = ['complete', 'loaded', 'interactive'];
if (loadedStates.includes(document.readyState) && document.body) {
  main();
} else {
  window.addEventListener('DOMContentLoaded', main, false);
}
