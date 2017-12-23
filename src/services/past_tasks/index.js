'use strict';

const path = require('path');
const hooks = require('./hooks');
const yaml = require('js-yaml');
const fs = require('fs');
require('datejs');


function loadYmlFile(file_name) {
  return yaml.safeLoad(fs.readFileSync(file_name, 'utf8'));
}

class Service {
  constructor(options) {
    this.options = options || {};
  }

  find(params) {
    return new Promise((resolve, reject) => {
      resolve(this.options.data);
    });
  }

  get(id, params) {
    return Promise.reject('Not yet implemented');
  }
}

module.exports = function () {
  const app = this;

  // Initialize our service with any options it requires
  const file = path.join(__dirname, '..', '..', '..', 'data', 'past_tasks.yml');
  const data = loadYmlFile(file);
  data.sort((a, b) => Date.parse(a.date).compareTo(Date.parse(b.date)));
  app.use('/past_tasks', new Service({
    data: data
  }));

  // Get our initialize service to that we can bind hooks
  const past_tasksService = app.service('/past_tasks');

  // Set up our before hooks
  past_tasksService.before(hooks.before);

  // Set up our after hooks
  past_tasksService.after(hooks.after);
};

module.exports.Service = Service;