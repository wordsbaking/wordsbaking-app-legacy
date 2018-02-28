const axios = require('axios');

async function call(method, url, data, options) {
  let response = await axios({
    ...(options || {}),
    data,
    method,
    url,
  });

  let responseData = response.data;

  if (!responseData) {
    return;
  }

  let {error, data: jsonData} = responseData;

  if (error) {
    throw new Error(error.code || error.message || 'Unknown error');
  }

  return jsonData;
}

module.exports = {
  get(url, data, options) {
    return call('get', url, data, options);
  },
  post(url, data, options) {
    return call('post', url, data, options);
  },
};
