const FS = require('fs');
const Path = require('path');

const minimist = require('minimist');

const {resolveVersion} = require('./utils/helpers');
const loadENV = require('./utils/load-env');

const argv = minimist(process.argv.slice(2));

const IS_PROD = !!argv.prod;

const ENV = loadENV(IS_PROD ? 'prod' : undefined);

let {platform, version} = argv;
let isBeta = !!argv.beta;

let versionProfile =
  IS_PROD || version
    ? resolveVersion(version)
    : {
        name: 'dev',
        code: 0,
        beta: false,
      };

patchAppIndex(ENV, platform, {
  ...versionProfile,
  beta: isBeta,
});

/////////////
// Helpers //
/////////////

function patchAppIndex(env, platform, versionProfile) {
  let path = Path.join(__dirname, '../bld/index.html');

  let content = FS.readFileSync(path, 'utf-8');

  content = content.replace(
    /<script id="env"[^>]*>[^]*?<\/script>/,
    `<script id="env">var ENV = ${JSON.stringify(env)};</script>`,
  );

  content = content.replace(
    /<script id="app-profile"[^>]*>[^]*?<\/script>/,
    `<script id="app-profile">var APP_PROFILE = ${JSON.stringify({
      platform,
      version: versionProfile,
    })};</script>`,
  );

  FS.writeFileSync(path, content);
}
