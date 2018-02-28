const Path = require('path');

const dotenv = require('dotenv');

function loadENV(target) {
  let env = dotenv.config({
    path: Path.join(__dirname, '../../', `.env${target ? `.${target}` : ''}`),
  }).parsed;

  for (let key of Object.keys(env)) {
    let value = env[key];

    if (/^true|false$/i.test(value)) {
      env[key] = value === 'true';
    } else if (/^\d+$|^\d*\.\d+/.test(value)) {
      env[key] = Number(value);
    }
  }

  return env;
}

module.exports = loadENV;
