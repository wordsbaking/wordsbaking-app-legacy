const FS = require('fs');
const Path = require('path');
const dotenv = require('dotenv');

let env = dotenv.config().parsed;
let versions = generateVersionsData();

patchAppIndex(env, versions.app);

/////////////
// Helpers //
/////////////

function generateVersionsData() {
  return {
    app: new Date().toISOString(),
  };
}

function patchAppIndex(env, version) {
  let path = Path.join(__dirname, '../bld/index.html');

  let content = FS.readFileSync(path, 'utf-8');

  content = content.replace(
    /<script id="app-env"[^>]*>[^]*?<\/script>/,
    `<script id="app-env">var ENV = ${JSON.stringify(env)};</script>`,
  );

  content = content.replace(
    /<script id="app-version"[^>]*>[^]*?<\/script>/,
    `<script id="app-version">var VERSION = '${version}';</script>`,
  );

  FS.writeFileSync(path, content);
}
