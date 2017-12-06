'use strict';

const FS = require('fs');
const Path = require('path');
const dotenv = require('dotenv');

let envJSON = JSON.stringify(dotenv.config().parsed);

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
