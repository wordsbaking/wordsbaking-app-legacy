module.exports = {
  resolveVersion(version) {
    if (!/^\d+\.\d+\.\d+$/.test(version)) {
      throw new Error('Invalid version');
    }

    let [major, minor, patch] = version.split('.').map(Number);

    return {
      name: version,
      code: major * 10000 + minor * 100 + patch,
    };
  },
};
