'use strict';

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const chub = require('./contacthub.connector.js');

const LISTEN_PORT = process.env.LISTEN_PORT || 8860;
const URL_PREFIX = process.env.URL_PREFIX || '';
const JWT_SHARED_SECRET = process.env.JWT_SHARED_SECRET || '';

const HUB_TICKET_EVENTS = {
  OPENED: 'openedTicket',
  REPLIED: 'repliedTicket',
  CLOSED: 'closedTicket'
};

const createOrUpdateHubCustomer = (hubData) => {
  return new Promise((resolve, reject) => {
    let cstId = null;
    chub.getCustomersByEmail(`${hubData.base.contacts.email}`)
    .then(response => {
      if (response && response.elements && response.elements.length) {
        cstId = response.elements[0].id;
      }
      let chubProm = null;
      if (!cstId) {
        return chub.addCustomer(hubData);
      } else {
        hubData.id = cstId;
        return chub.patchCustomer(cstId, hubData);
      }
    })
    .then(result => {
      return resolve(result);
    })
    .catch(err => {
      console.log(err);
      return reject(err);
    });
  });
};

const createHubEvent = (eventData) => {
  console.log(`Create Hub Event`, eventData);
  return chub.addEvent(eventData);
};

const zenTicketToHubEvent = (ticket) => {
  const createdAt = new Date(ticket.created_at_with_timestamp || null);
  const updatedAt = new Date(ticket.updated_at_with_timestamp || null);
  const status = ticket.status?ticket.status.toUpperCase():null;
  let hubStatus = 'OPENED';
  if (status === 'NEW') {
    hubStatus = 'OPENED';
  } else if (status === 'PENDING') {
    hubStatus = 'REPLIED';
  } else if (status === 'CLOSED') {
    hubStatus = 'CLOSED';
  } else if (status === 'SOLVED') {
    hubStatus = 'CLOSED';
  } else {
    if (updatedAt.getTime() > createdAt.getTime()) {
      hubStatus = 'REPLIED';
    } else {
      hubStatus ='OPENED';
    }
  }
  return HUB_TICKET_EVENTS[hubStatus]?HUB_TICKET_EVENTS[hubStatus]:null;
}

/** APP routes **/
const app = express();
app.use(bodyParser.json());

const secureRoute = express.Router();
secureRoute.use((req, res, next) => {
  let authState = req.method === 'OPTIONS'?true:false;
  if (!authState && req.headers && req.headers.authorization) {
    jwt.verify(req.headers.authorization.replace('JWT ', ''), JWT_SHARED_SECRET, function(err, decoded) {
      if (err) {
        console.log(err);
      } else {
        authState = true;
      }
    });
  }
  if (authState) {
    next();
  } else {
    res.status(403).send('Unauthorized');
    res.end();
  }
});
app.use(`${URL_PREFIX}/hub/`, secureRoute);

app.get(`${URL_PREFIX}/ping`, (req, res) => {
  res.send('pong');
  res.end();
});

app.post(`${URL_PREFIX}/zdtt`, (req, res) => {
  const response = {
    success: false,
    errorMessage: 'Unknown error',
    data: null
  };
  const cstData = {
    base: {
      contacts: {
        email: `${req.body.requester.email}`
      },
      firstName: `${req.body.requester.first_name}`,
      lastName: `${req.body.requester.last_name}`
    }
  };
  const eventData = {
    customerId: null,
    type: zenTicketToHubEvent(req.body.ticket),
    context: 'CONTACT_CENTER',
    date: (new Date()),
    properties: {
      ticketId: `${req.body.ticket.id}`,
      subject: `${req.body.ticket.title}`,
      text: `${req.body.comments.latest_comment_formatted}`,
      extraProperties: {
      }
    }
  };
  createOrUpdateHubCustomer(cstData)
  .then(result => {
    eventData.customerId = result.id;
    return eventData;
  })
  .then(result => createHubEvent(result))
  .then(result => {
    response.success = true;
    response.errorMessage = null;
    response.data = result;
    return response;
  })
  .catch(err => {
    response.success= false;
    response.errorMessage = `${err}`;
    response.data = null;
    return response;
  })
  .then(() => {
    res.send(response);
    res.end();
  })
  .catch(err => {
    console.log(err);
  });
});

app.options(`${URL_PREFIX}/hub/find`, cors());
app.get(`${URL_PREFIX}/hub/find`, cors(), (req, res) => {
  const response = {
    success: false,
    errorMessage: 'Unknown error',
    data: null
  };
  const email = req.query.email;
  const phone = req.query.phone;
  if (!email && !phone) {
    response.success = false;
    response.errorMessage = 'Missing parameters';
    res.send(response);
    res.end();
  } else {
    chub.getCustomersByContacts(email, phone)
    .then(data => {
      if (data.elements) {
        response.success = true;
        response.errorMessage = null;
        response.data = data.elements.length?data.elements[0]:null;
      } else {
        response.success = false;
        response.errorMessage = 'Invalid response';
      }
      return response;
    })
    .catch(err => {
      response.success = false;
      response.errorMessage = `${err}`;
      return response;
    })
    .then(() => {
      res.send(response);
      res.end();
    })
    .catch(err => {
      console.log(err);
    });
  }
});

app.options(`${URL_PREFIX}/hub/:id`, cors());
app.get(`${URL_PREFIX}/hub/:id`, cors(), (req, res) => {
  const response = {
    success: false,
    errorMessage: 'Unknown error',
    data: null
  };
  chub.getCustomerById(req.params.id)
  .then(result => {
    response.success = true;
    response.data = result;
    response.errorMessage = null;
  })
  .catch(err => {
    response.success = false;
    response.data = null;
    response.errorMessage = err;
  })
  .then(result => {
    res.send(response);
    res.end();
  })
  .catch(err => {
    console.log(err);
  });
});

app.options(`${URL_PREFIX}/hub`, cors());
app.post(`${URL_PREFIX}/hub`, cors(), (req, res) => {
  const response = {
    success: false,
    errorMessage: 'Unknown error',
    data: null
  };
  const cstData = req.body;
  createOrUpdateHubCustomer(cstData)
  .then(result => {
    response.success= true;
    response.errorMessage = null;
    response.data = result;
  })
  .catch(err => {
    response.success = false;
    response.errorMessage = err;
    response.data = null;
  })
  .then(() => {
    res.send(response);
    res.end();
  })
  .catch(err => {
    console.log(err);
  });
});


app.options(`${URL_PREFIX}/hub/:hubid/events`, cors());
app.get(`${URL_PREFIX}/hub/:hubid/events`, cors(), (req, res) => {
  const response = {
    success: false,
    errorMessage: 'Unknown error',
    data: null
  };
  const hubId = `${req.params.hubid}`;
  if (!hubId) {
    response.success = false;
    response.errorMessage = 'Missing parameters';
    res.send(response);
    res.end();
    return false;
  }
  chub.getEvents(hubId)
  .then(data => {
    response.success = true;
    response.errorMessage = null;
    response.data = data;
  })
  .catch(err => {
    response.success = false;
    response.errorMessage = `${err}`;
  })
  .then(() => {
    res.send(response);
    res.end();
  })
  .catch(err => {
    console.log(err);
  });
});

app.listen(LISTEN_PORT, () => {
  console.log(`[${(new Date()).toISOString()}] Contacthub <-> Zendesk listening on port ${LISTEN_PORT}`);
});

