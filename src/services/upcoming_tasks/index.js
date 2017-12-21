'use strict';

const path = require('path');
const hooks = require('./hooks');
var Project = require('read-tasks/lib/project');


class Service {
  constructor(options) {
    this.options = options || {};
  }

  find(params) {
    return new Promise((resolve, reject) => {
      const projects = Project.fromYmlFile(this.options.file);
      const tasks = projects.flatOrderedByDeadlineAndUrgency();
      return resolve(tasks.map(t => t.toData()));
    });
  }

  get(id, params) {
    return Promise.reject('Not yet implemented');
  }
}

module.exports = function () {
  const app = this;

  // Initialize our service with any options it requires
  app.use('/upcoming_tasks', new Service({
    file: path.join(__dirname, '..', '..', '..', 'data', 'upcoming_tasks.yml')
  }));

  // Get our initialize service to that we can bind hooks
  const upcoming_tasksService = app.service('/upcoming_tasks');

  // Set up our before hooks
  upcoming_tasksService.before(hooks.before);

  // Set up our after hooks
  upcoming_tasksService.after(hooks.after);
};

module.exports.Service = Service;