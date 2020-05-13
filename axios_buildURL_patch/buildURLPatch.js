'use strict';

module.exports = () => {
    const axios = require('axios');
    if (typeof XMLHttpRequest !== 'undefined') {
      // For browsers use XHR adapter
      axios.defaults.adapter = require('./xhr');
    } else if (typeof process !== 'undefined') {
      // For node use HTTP adapter
      axios.defaults.adapter = require('./http');
    }
}