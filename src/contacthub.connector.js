'use strict';
require('../axios_buildURL_patch/buildURLPatch')();
const ContactHub = require('contacthub-sdk-nodejs');

const ch = new ContactHub({
  token: process.env.CONTACTHUB_TOKEN,
  workspaceId: process.env.CONTACTHUB_WORKSPACE_ID,
  nodeId: process.env.CONTACTHUB_NODE_ID
});

const getCustomerById = (id) => {
  return ch.getCustomer(id);
}

const getCustomerByExternalId = (externalId) => {
  return ch.getCustomers({
    externalId: externalId
  });
};

const addCustomer = (customerData) => {
  console.log(`adding on HUB:`, customerData);
  return ch.addCustomer(customerData);
};

const updateCustomer = (customerId, customerData) => {
  return ch.updateCustomer(customerId, customerData);
};

const patchCustomer = (customerId, customerData) => {
  return ch.patchCustomer(customerId, customerData);
};

const addEvent = (eventData) => {
  return ch.addEvent(eventData);
}

const getCustomersByEmail = (contactEmail) => {
  const options = {};
  options.sort = 'updatedAt';
  options.direction = 'DESC';
  options.query = {
    name: 'contactEmail',
    query: {
      type: 'simple',
      are: {
        condition: {
          type: 'atomic',
          attribute: 'base.contacts.email',
          operator: 'EQUALS',
          value: `${contactEmail}`
        }
      }
    }
  };
  return ch.getCustomers(options);
};

const getCustomersByContacts = (contactEmail, contactPhone) => {
  const options = {};
  options.sort = 'updatedAt';
  options.direction = 'DESC';
  options.query = {
    name: 'userContacts',
    query: {
      type: 'simple',
      are: {
        condition: {
          type: 'composite',
          conjunction: 'or',
          conditions: []
        }
      }
    }
  };
  if (contactEmail) {
    options.query.query.are.condition.conditions.push(
      {
        type: 'atomic',
        attribute: 'base.contacts.email',
        operator: 'EQUALS',
        value: `${contactEmail}`
      }
    );
  }
  if (contactPhone) {
    options.query.query.are.condition.conditions.push(
      {
        type: 'atomic',
        attribute: 'base.contacts.mobilePhone',
        operator: 'EQUALS',
        value: `${contactPhone}`
      }
    );
  }
  return ch.getCustomers(options);
};

const getCustomersByLastUpdate = (lastUpdateDate) => {
  const options = {};
  options.sort = 'updatedAt';
  options.direction = 'DESC';
  options.query = {
    name: 'lastModified',
    query: {
      type: 'simple',
      are: {
        condition: {
          type: 'composite',
          conjunction: 'and',
          conditions: []
        }
      }
    }
  };
  options.query.query.are.condition.conditions.push(
    {
      type: 'atomic',
      attribute: 'updatedAt',
      operator: 'GT',
      value: `${lastUpdateDate}`
    }
  );
  options.query.query.are.condition.conditions.push(
    {
      type: 'atomic',
      attribute: 'externalId',
      operator: 'IS_NOT_NULL',
      value: ``
    }
  );
  return ch.getCustomers(options);
};

const getEvents = (hubId) => {
    return new Promise(
      function(resolve, reject) {
        getEventsList(hubId, null, [], resolve, reject);
      }
    );
}

const getEventsList = (hubId, promise, resultList, resolve, reject) => {
  if (promise) {
    if (promise.page.current < promise.page.total - 1) {
      promise.page.next()
      .then(promise => {
        resultList = resultList.concat(promise.elements);
        getEventsList(hubId, promise, resultList, resolve, reject);
      })
      .catch(err => reject(err));
    } else {
      resolve(resultList);
    }
  } else if (resultList.length === 0) {
    ch.getEvents(hubId)
    .then(promise => {
      resultList = resultList.concat(promise.elements);
      getEventsList(hubId, promise, resultList, resolve, reject);
    })
    .catch(err => reject(err));
  } else {
    reject('Something wrong.');
  }
}

module.exports = {
  getCustomerById,
  getCustomerByExternalId,
  addCustomer,
  updateCustomer,
  patchCustomer,
  getCustomersByLastUpdate,
  getCustomersByEmail,
  getCustomersByContacts,
  addEvent,
  getEvents
}
