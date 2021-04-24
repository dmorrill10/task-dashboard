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
  const elemHasRendered = elem && elem.length;
  return elemHasRendered ? f() : window.requestAnimationFrame(
    () => { return afterRender(selector, f); });
}

function afterHasSize(selector, f) {
  const elem = $(selector);
  const elemHasSize = elem && elem.length && elem.height() > 0.0 && elem.width() > 0.0;
  return elemHasSize ? f() : window.requestAnimationFrame(
    () => { return afterHasSize(selector, f); })
}

const hooks = require('feathers-hooks');

// Create a client side Feathers application that uses the socket for connecting
// to services
let app = feathers();
app.configure(socketio(io('/'))).configure(hooks());
let communicator = new Communicator(app);

function constructTasks(data) {
  var tasks = [];
  for (const day of data) {
    for (const task of day.tasks) {
      const duration = TimeInterval.isIntervalString(task.duration) ?
        TimeInterval.fromIntervalString(task.duration, day.date) :
        TimeInterval.fromDurationString(task.duration, day.date);
      if (duration > 10) {
        console.warn("Duration ${duration} > 10 hours on ${day.date}. Is this a mistake in the data file?");
      }
      tasks.push({ duration: duration, subject: task.subject, description: task.description });
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

// const marked = require('marked');


function tasksByWeekAndDay(tasks) {
  let weeks = {};
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

function roundToOneHundredth(v) {
  return Math.round(100 * v) / 100.0;
}

function trListFromRows(rows) {
  let l = [];
  for (let i = 0; i < rows.length; ++i) {
    l.push(<tr key={l.length}>{rows[i]}</tr>);
  }
  return l;
}

function numWorkDays(dayHours) {
  return dayHours.reduce((sum, h) => sum + (h > 1), 0);
}

function totalHours(dayHours) {
  return dayHours.reduce((sum, h) => sum + h, 0);
}

function hoursInWeekTableRow(weekNumber, weekStartDateString, dayHours) {
  let row = [<td key={`week-${weekNumber}`} className='week'>{weekStartDateString}</td>];
  for (let i = 0; i < dayHours.length; ++i) {
    const h = dayHours[i];
    const day = Date.CultureInfo.abbreviatedDayNames[i];
    row.push(
      <td key={`${day}-${weekNumber}`} className={day}>
        <a onClick={function () {
          return window.tasksOverTime.showSubjectHours(weekStartDateString, day);
        }}>
          {roundToOneHundredth(h)}
        </a>
      </td>
    );
  }
  return row;
}

class Calendar extends React.Component {
  hoursOnEachDay(weekStartDateString) {
    const days = this.props.tasks[weekStartDateString];
    let dayHours = [];
    for (const day of Date.CultureInfo.abbreviatedDayNames) {
      dayHours.push(days[day].reduce((sum, task) => sum + task.duration.durationH(), 0.0));
    }
    return dayHours;
  }
  dayRows() {
    if (Object.keys(this.props.tasks).length < 1) {
      return null;
    }

    const today = Date.today();
    let weekStartDate = today.is().sunday() ? today : today.last().sunday();
    let foundFirstWeek = false;
    let weekTotals = [];
    let rows = [];
    let weekStartDates = [];
    let i = 0;
    let myNumWorkDays = [];
    while (i < window.tasksOverTime.numWeeks()) {
      const weekStartDateString = weekStartDate.toString('MMM d, yyyy');
      weekStartDates.push(weekStartDateString);
      if (weekStartDateString in this.props.tasks) {
        i += 1;
        foundFirstWeek = true;
        const dayHours = this.hoursOnEachDay(weekStartDateString);
        const weekTotal = totalHours(dayHours);
        const row = hoursInWeekTableRow(rows.length, weekStartDateString, dayHours);
        weekTotals.push(weekTotal);
        row.push(
          <td key={`total-${rows.length}`} className={`total-${rows.length}`}>
            <a onClick={function () {
              return window.tasksOverTime.showSubjectHoursTotal(weekStartDateString);
            }}>
              {roundToOneHundredth(weekTotal)}
            </a>
          </td>
        );
        const n = numWorkDays(dayHours);
        myNumWorkDays.push(n);
        row.push(
          <td key={`num-work-days-${rows.length}`} className={`num-work-days-${rows.length}`}>
            <a onClick={function () {
              return window.tasksOverTime.showSubjectHoursTotal(weekStartDateString);
            }}>{n}</a>
          </td>
        );
        row.push(
          <td key={`hours-per-work-day-${rows.length}`} className={`hours-per-work-day-${rows.length}`}>
            <a onClick={function () {
              return window.tasksOverTime.showSubjectHoursTotal(weekStartDateString);
            }}>
              {roundToOneHundredth(weekTotal / n)}
            </a>
          </td>
        );
        rows.push(row);
      }
      weekStartDate = weekStartDate.last().sunday();
    }
    let myTotalHours = 0.0;
    let numPastWorkDays = 0
    // Rows are ordered from most (0) to least recent (rows.length - 1).
    for (let i = rows.length - 1; i >= 0; --i) {
      const numWeeks = rows.length - i;
      myTotalHours += weekTotals[i];

      // Hours per week average column
      rows[i].push(
        <td key={`avg-${i}`} className={`avg-${i}`}>
          <a onClick={function () {
            return window.tasksOverTime.showSubjectHoursAvg(
              weekStartDates[rows.length - 1],
              weekStartDates[i]
            );
          }}>
            {roundToOneHundredth(myTotalHours / numWeeks)}
          </a>
        </td>
      );

      numPastWorkDays += myNumWorkDays[i];
      rows[i].push(
        <td key={`avg-num-work-days-${i}`} className={`avg-num-work-days-${i}`}>
          {roundToOneHundredth(numPastWorkDays / numWeeks)}
        </td>
      );
      // Hours per work day column
      rows[i].push(
        <td key={`avg-hours-per-work-day-${i}`} className={`avg-hours-per-work-day-${i}`}>
          {roundToOneHundredth(myTotalHours / numPastWorkDays)}
        </td>
      );
    }
    return trListFromRows(rows);
  }
  render() {
    const dayHeaders = Date.CultureInfo.abbreviatedDayNames.map(
      (day) => <th key={`${day}-label`} className={`${day}-label`}>{day}</th>
    );
    return (
      <table className='table table-striped table-responsive'>
        <thead>
          <tr>
            <th key='week-label' className='week-label'>week</th>
            {dayHeaders}
            <th key='total-label' className='total-label'>total</th>
            <th key='num-work-days-label' className='num-work-days-label'># wd(1)</th>
            <th key='hours-per-work-day-label' className='hours-per-work-day-label'>h/wd(1)</th>
            <th key='avg-label' className='avg-label'>avg.</th>
            <th key='avg-num-work-days-label' className='avg-num-work-days-label'>avg. # wd(1)</th>
            <th key='avg-hours-per-work-day-label' className='avg-hours-per-work-day-label'>avg. h/wd(1)</th>
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

function createHoursBarChart(elementId, dataLabels, barHeights, dataSetLabel) {
  const ctx = document.getElementById(elementId).getContext('2d');
  return new Chart(ctx, {
    type: 'horizontalBar',
    data: {
      labels: dataLabels,
      datasets: [{
        label: dataSetLabel,
        data: barHeights
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero: true,
            min: 0
          },
          scaleLabel: {
            labelString: 'Hours',
            display: true
          }
        }]
      }
    }
  });
}

class TasksOverTime {
  constructor(tasksByWeekAndDay_) {
    this._tasksByWeekAndDay = tasksByWeekAndDay_;
    this._chart = undefined;
  }

  numWeeks() {
    return Object.keys(this._tasksByWeekAndDay).length;
  }

  showSubjectHours(week, day) {
    const myTasks = this._tasksByWeekAndDay[week][day];
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

    if (this._chart !== undefined) {
      this._chart.destroy();
    }
    const date = Date.parse(week).moveToDayOfWeek(Date.parse(day).getDay()).toString('MMM d, yyyy');
    this._chart = createHoursBarChart('hours-by-subject', labels, times, date);
  }

  showSubjectHoursTotal(weekString) {
    let hours = {};
    for (const day of Date.CultureInfo.abbreviatedDayNames) {
      const myTasks = this._tasksByWeekAndDay[weekString][day];
      for (const task of myTasks) {
        if (!(task.subject in hours)) {
          hours[task.subject] = 0.0;
        }
        hours[task.subject] += task.duration.durationH();
      }
    }
    const labels = Object.keys(hours);
    let times = []
    for (const label of labels) {
      times.push(hours[label]);
    }
    if (this._chart !== undefined) {
      this._chart.destroy();
    }
    this._chart = createHoursBarChart('hours-by-subject', labels, times, `Week of ${weekString}`);
  }

  showSubjectHoursAvg(earliestWeekString, latestWeekString) {
    let week = Date.parse(earliestWeekString);
    const latestWeek = Date.parse(latestWeekString);

    let hours = {};
    let numWeeks = 0;
    while (week <= latestWeek) {
      const weekString = week.toString('MMM d, yyyy');
      if (weekString in this._tasksByWeekAndDay) {
        for (const day of Date.CultureInfo.abbreviatedDayNames) {
          const myTasks = this._tasksByWeekAndDay[weekString][day];
          for (const task of myTasks) {
            if (!(task.subject in hours)) {
              hours[task.subject] = 0.0;
            }
            hours[task.subject] += task.duration.durationH();
          }
        }
      }
      numWeeks += 1;
      week = week.next().sunday();
    }
    const labels = Object.keys(hours);
    let times = []
    for (const label of labels) {
      times.push(hours[label] / numWeeks);
    }
    if (this._chart !== undefined) {
      this._chart.destroy();
    }
    this._chart = createHoursBarChart('hours-by-subject', labels, times, `Avg. from ${earliestWeekString} to ${latestWeekString} (${numWeeks} weeks)`);
  }
}

function main() {
  communicator.findPastTasks().then(function (data) {
    const tasks = constructTasks(data);
    const tasksByWeek = tasksByWeekAndDay(tasks);
    window.tasksOverTime = new TasksOverTime(tasksByWeek);

    return ReactDOM.render(
      <Calendar tasks={tasksByWeek} />,
      document.getElementById('calendar')
    );
  });

  communicator.findUpcomingTasks().then(function (data) {
    const ctx = document.getElementById('upcoming-tasks').getContext('2d');
    const today = Date.today().at('12am');
    const maxDate = today.clone().next().week();

    return new Chart(ctx, {
      type: 'horizontalBar',
      data: {
        labels: data.map(task => task.name),
        datasets: [{
          label: 'Upcoming Tasks',
          data: data.map(task => task.deadline === null ? maxDate.getTime() : Date.parse(task.deadline).getTime())
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          xAxes: [{
            ticks: {
              userCallback: function (epoch) {
                return (new Date(epoch)).toString('MMM d');
              },
              min: today.getTime(),
              max: maxDate.getTime(),
              stepSize: 24 * 60 * 60 * 1000
            }
          }]
        }
      }
    });
  });
}

const loadedStates = ['complete', 'loaded', 'interactive'];
if (loadedStates.includes(document.readyState) && document.body) {
  main();
} else {
  window.addEventListener('DOMContentLoaded', main, false);
}
