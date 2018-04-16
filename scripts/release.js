const FS = require('fs');
const Path = require('path');

const inquirer = require('inquirer');
const chalk = require('chalk');
const dotenv = require('dotenv');

const {resolveVersion} = require('./utils/helpers');
const exec = require('./utils/exec');
const apiCaller = require('./utils/api-caller');
const loadENV = require('./utils/load-env');

const projectDir = Path.join(__dirname, '../');
const cordovaAppDir = Path.join(projectDir, '../wordsbaking-app-cordova');

const ENV = loadENV('prod');

const logger = {
  log: data => process.stdout.write(data),
  error: data => process.stderr.write(data),
};

run()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error(chalk.red('❌ release failed!'));
    console.error(chalk.red(error));
    process.exit(1);
  });

async function run() {
  let secretSignal = undefined;

  while (true) {
    let result = await inquirer.prompt({
      type: 'password',
      name: 'secretSignal',
      message: 'Secret signal',
      validate: value => {
        if (!value) {
          return 'Need a developer secret signal!';
        }

        return true;
      },
    });

    secretSignal = result.secretSignal;

    try {
      await apiCaller.post(`${ENV.apiBaseUrl}/developer-verify`, {
        secretSignal,
      });

      break;
    } catch (error) {
      console.error(chalk.red('Developer secret signal incorrect!'));
    }
  }

  let {platform} = await inquirer.prompt({
    type: 'list',
    name: 'platform',
    message: 'Which platform to release',
    choices: [
      {name: 'Android', value: 'android'},
      {name: 'IOS', value: 'ios'},
      {name: 'Browser', value: 'browser'},
    ],
  });

  let {isBeta} = await inquirer.prompt({
    type: 'confirm',
    name: 'isBeta',
    message: 'This is beta version',
  });

  let previousVersion = await getLatestAppVersion(platform);

  let {version} = await inquirer.prompt({
    type: 'input',
    name: 'version',
    message: `New version`,
    default: previousVersion
      ? previousVersion.replace(/\d+$/, match => Number(match) + 1)
      : '1.0.0',
    validate: value => {
      if (!/^\d+\.\d+\.\d+$/.test(value)) {
        return 'Please enter a valid version (et. 1.0.0).';
      }

      if (
        previousVersion &&
        resolveVersion(value).code < resolveVersion(previousVersion).code
      ) {
        return 'The new version must be ahead of the current version.';
      }

      if (previousVersion === value) {
        return 'Duplicate version.';
      }

      return true;
    },
  });

  let {description} = await inquirer.prompt({
    type: 'input',
    name: 'description',
    message: 'Description',
  });

  console.log(`
Release profile:
     platform: ${chalk.blueBright(platform)}
         beta: ${chalk.blueBright(isBeta ? 'YES' : 'NO')}
      version: ${chalk.blueBright(version)}
  description: ${chalk.blueBright(
    description ? prettifyDescription(description, '               ') : '无',
  )}
`);

  let {isOk} = await inquirer.prompt({
    type: 'confirm',
    name: 'isOk',
    message: 'Is this ok',
  });

  if (!isOk) {
    return;
  }

  let isBrowser = platform === 'browser';

  let execOptions = {
    projectDir,
    logger,
  };

  await exec(
    `yarn ${isBrowser ? 'build' : 'build:hybird'} --prod --aot false`,
    execOptions,
  );

  await exec(
    `yarn post-build --platform=${platform} --version=${version} ${isBeta
      ? '--beta'
      : ''} --prod`,
    execOptions,
  );

  if (!isBrowser) {
    await exec('yarn cordova:prepare', execOptions);

    let logData = '';

    let cordovaBuildCommand = `cordova build --release ${platform} --device -- --build-version=${version}`;

    await exec(cordovaBuildCommand, {
      cwd: cordovaAppDir,
      logger: {
        ...logger,
        log: data => {
          logData += data.toString('utf8');
          return logger.log(data);
        },
      },
    });

    if (platform === 'android' && logData.indexOf('BUILD SUCCESSFUL') === -1) {
      throw new Error('Cordova building failed!');
    } else if (
      platform === 'ios' &&
      logData.indexOf('** EXPORT SUCCEEDED **') === -1
    ) {
      throw new Error('Cordova building failed!');
    }

    let installPackagePath = Path.join(
      projectDir,
      'bld',
      `wordsbaking${isBeta ? '_beta' : ''}_v${version.replace(
        /\./g,
        '_',
      )}${platform === 'ios' ? '.ipa' : platform === 'android' ? '.apk' : ''}`,
    );

    if (platform === 'android') {
      FS.copyFileSync(
        Path.join(
          cordovaAppDir,
          'platforms/android/build/outputs/apk/release/android-release.apk',
        ),
        installPackagePath,
      );
    } else if (platform === 'ios') {
      FS.copyFileSync(
        Path.join(cordovaAppDir, 'platforms/ios/build/device/Wordsbaking.ipa'),
        installPackagePath,
      );
    }

    if (installPackagePath) {
      console.log('Install package output at:\n  ', installPackagePath);
    }
  }

  let {published} = await inquirer.prompt({
    type: 'confirm',
    name: 'published',
    message: 'Please make sure this release version is publish',
  });

  if (!published) {
    console.warn(chalk.yellow('WARNING: this release version not publish!!!'));
    return;
  }

  let {downloadUrl} = await inquirer.prompt({
    type: 'input',
    name: 'downloadUrl',
    message: 'Download url',
    validate: value => {
      if (!/^https?:\/\/.+/i.test(value)) {
        return 'Please provider this release version install package download url!';
      }

      return true;
    },
  });

  await upgradeAppVersion(
    platform,
    isBeta,
    version,
    description,
    downloadUrl,
    secretSignal,
  );

  console.log(chalk.green('👌 release finished!'));
}

async function getLatestAppVersion(platform) {
  let appVersionEntry = await apiCaller.post(
    `${ENV.apiBaseUrl}/latest-app-version`,
    {
      platform,
    },
  );

  if (appVersionEntry) {
    return appVersionEntry.version;
  } else {
    return undefined;
  }
}

async function upgradeAppVersion(
  platform,
  isBeta,
  version,
  description,
  downloadUrl,
  secretSignal,
) {
  let publisher = 'unknown';

  await exec('git config --global user.name', {
    cwd: projectDir,
    logger: {
      log(data) {
        publisher = data.toString().trim();
      },
    },
  });

  return apiCaller.post(`${ENV.apiBaseUrl}/upgrade-app-version`, {
    platform,
    beta: isBeta,
    version,
    publisher,
    description,
    downloadUrl,
    secretSignal,
  });
}

function prettifyDescription(description, space) {
  if (description.indexOf('[x]') === -1) {
    return description;
  }

  let descriptionItems = description.split(/\s*\[x\]\s*/);

  descriptionItems.shift();

  return descriptionItems
    .map((item, index) => {
      let lineNum = index + 1;

      return `${lineNum === 1 ? '' : space}${lineNum}. ${item}`;
    })
    .join('\n');
}
