const Path = require('path');
const exec = require('./utils/exec');

const version = process.argv[2];

const logger = {
  log: data => process.stdout.write(data),
  error: data => process.stderr.write(data),
};

const cwd = Path.join(__dirname, '..');

async function run() {
  await exec(
    'yarn add ' +
      [
        '@angular/animations',
        '@angular/common',
        '@angular/compiler',
        '@angular/core',
        '@angular/forms',
        '@angular/http',
        '@angular/platform-browser',
        '@angular/platform-browser-dynamic',
        '@angular/router',
      ]
        .map(packageName => `${packageName}@${version}`)
        .join(' '),
    {
      logger,
      cwd,
    },
  );

  await exec(
    'yarn add ' +
      ['@angular/compiler-cli', '@angular/language-service']
        .map(packageName => `${packageName}@${version}`)
        .join(' '),
    {
      logger,
      cwd,
    },
  );
}

run().catch(console.error);
