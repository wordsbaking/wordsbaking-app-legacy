const childProcess = require('child_process');

const cmdify = require('cmdify');

require('villa/bld/edge/node');

const v = require('villa');

function exec(execute, options = {}) {
  const logger = options.logger;

  let argv = execute.split(/\s+/);
  let command = argv[0];
  let args = argv.slice(1).concat(options.args || []);

  const processInstance = childProcess.spawn(cmdify(command), args, {
    cwd: options.cwd || process.cwd(),
  });

  if (logger) {
    logger.log && processInstance.stdout.on('data', logger.log);
    logger.error && processInstance.stderr.on('error', logger.error);
  }

  return v.awaitable(processInstance);
}

module.exports = exec;
