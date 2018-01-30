'use strict';

const FS = require('fs');
const Path = require('path');
const dotenv = require('dotenv');
let env = dotenv.config().parsed;

for (let key of Object.keys(env)) {
  let value = env[key];

  if (/^true|false$/i.test(value)) {
    env[key] = value === 'true';
  } else if (/^\d+$|^\d*\.\d+/.test(value)) {
    env[key] = Number(value);
  }
}

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
