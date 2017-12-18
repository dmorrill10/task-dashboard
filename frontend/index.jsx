require('jquery');
require('jquery-ujs');
require('./style/index.sass');
require('bootstrap-sass/assets/javascripts/bootstrap.min.js');

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

function main() {
  return communicator.findPastTasks().then(function (data) {
    return ReactDOM.render(
      <ReactJson src={data} />,
      document.getElementById('app')
    );
  });
}

const loadedStates = ['complete', 'loaded', 'interactive'];
if (loadedStates.includes(document.readyState) && document.body) {
  main();
} else {
  window.addEventListener('DOMContentLoaded', main, false);
}
