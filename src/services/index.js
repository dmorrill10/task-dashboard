'use strict';


const pastTasks = require('./past_tasks');


module.exports = function() {
  const app = this;


  app.configure(pastTasks);
};
