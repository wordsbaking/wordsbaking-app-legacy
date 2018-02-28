'use strict';

const FS = require('fs');
const Path = require('path');

const loadENV = require('./scripts/utils/load-env');

let env = loadENV();

let envJSON = JSON.stringify(env);

module.exports = {
  '/': {
    bypass(req, res) {
      route(req, res);
    },
  },
};

function route(req, res) {
  let url = req.url;

  switch (true) {
    case url.startsWith('/dev-env.js'):
      res.send(`var ENV = ${envJSON}`);
      break;
    case url.startsWith('/cordova.js'):
      res.send('');
      break;
  }
}
