'use strict';


const upcomingTasks = require('./upcoming_tasks');


const pastTasks = require('./past_tasks');


module.exports = function() {
  const app = this;


  app.configure(pastTasks);
  app.configure(upcomingTasks);
};
