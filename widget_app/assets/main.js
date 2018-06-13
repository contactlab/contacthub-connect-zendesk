var serverUrl = null;
var client = null;
var email = '';
var phone = '';
var hubId = null;
var zenDeskIdentity = null;

window.addEventListener('load', function(event) {
  HandlebarsIntl.registerWith(Handlebars);
  Handlebars.registerHelper('ifEquals', function(v1, v2, options) {
    if(v1 === v2) {
      return options.fn(this);
    }
    return options.inverse(this);
  });
  Handlebars.registerHelper('ifModule', function(v1, v2, options) {
    if(v1 % v2 === 0) {
      return options.fn(this);
    }
    return options.inverse(this);
  });
  Handlebars.registerHelper("math", function(lvalue, operator, rvalue, options) {
    lvalue = parseFloat(lvalue);
    rvalue = parseFloat(rvalue);

    return {
        "+": lvalue + rvalue,
        "-": lvalue - rvalue,
        "*": lvalue * rvalue,
        "/": lvalue / rvalue,
        "%": lvalue % rvalue
    }[operator];
  });
  Handlebars.registerHelper('isArray', function(v1, options) {
    if(Array.isArray(v1)) {
      return options.fn(this);
    }
    return options.inverse(this);
  });

  client = ZAFClient.init();
  var requestedData = '';
  client.invoke('resize', {
    width: '100%',
    height: '240px'
  });
  client.metadata()
    .then(metadata => {
      if (metadata && metadata.settings) {
        serverUrl = metadata.settings.target_url;
      }
      if (!serverUrl) {
        showError('Missing remote server url setting.');
        throw 'Missing remote server url setting.';
      }
      return client.context();
    })
    .then(context => {
      requestedData = context.location === 'ticket_sidebar' ? 'ticket.requester' : 'user';
      return client.get(requestedData);
    })
    .then(data => {
      var userData = data[requestedData]?data[requestedData].identities:null;
      zenDeskIdentity = data[requestedData] || null;
      if (userData && userData.length) {
        userData.forEach(d => {
          if (d.type === 'email') {
            email = d.value;
          }
          if (d.type === 'phone_number') {
            phone = d.value;
          }
        });
      }
      if (email || phone) {
        requestHubInfo();
      }
    })
    .catch(err => {
      console.log('ERR:', err);
    });
});

window.addEventListener('load', function(event) {
  var tabs = document.querySelectorAll('.tabs-element');
  tabs.forEach(function(e) {
    e.addEventListener('click', handleTabClick);
  });
});

function zdIdentityToUser(zdIdentity) {
  var result = null;
  if (zdIdentity) {
    var names = zdIdentity.name?zdIdentity.name.split(' ').reverse():[];
    result = {
      base: {
        firstName: names.length>0?names[0]:undefined,
        lastName: names.length>1?names[1]:undefined,
        pictureUrl: zdIdentity.avatarUrl || undefined,
        contacts: {
          email: email || undefined,
          mobilePhone: phone || undefined
        }
      }
    };
  }
  return result;
}

function handleAddUserClick(event) {
  if (zenDeskIdentity) {
    var user = zdIdentityToUser(zenDeskIdentity);
    saveHubInfo(user);
  }
}

function handleTabClick(event) {
  var currentTarget = event.currentTarget;
  var panel = currentTarget?currentTarget.dataset['target']:null;
  var targetPanel = panel?document.getElementById(panel):null;
  if (targetPanel) {
    var els = document.querySelectorAll('.tabs-element');
    els.forEach(function(e) {
      e.classList.remove('active');
    });
    els = document.querySelectorAll('.content-panel');
    els.forEach(function(e) {
      e.classList.remove('active');
    });
    currentTarget.classList.add('active');
    targetPanel.classList.add('active');
    requestHub(panel);
  }
}

function requestHub(content) {
  if (content === 'profile-content') {
    return requestHubInfo();
  }
  if (content === 'events-content') {
    return requestHubEvents();
  }
}

function requestHubInfo() {
  var settings = {
    url: hubId?`${serverUrl}/hub/${hubId}`:`${serverUrl}/hub/find/?email=${email || ''}&phone=${phone || ''}`,
    headers: {'Authorization': 'JWT {{jwt.token}}'},
    jwt: {
      algorithm: 'HS256',
      secret_key: '{{setting.shared_secret}}',
      expiry: 10,
      claims: {
        iss: 'contactlab-rd'
      }
    },
    secure: true,
    type: 'GET',
    dataType: 'json'
  };
  client.request(settings)
  .then(result => {
    if (result && result.success) {
      if (result.data) {
        hubId = result.data.id;
        showInfo(result.data);
      } else {
        showNotFound();
      }
    } else {
      showError(result && result.errorMessage ? result.errorMessage : 'Request processing error');
    }
  })
  .catch(err => {
    console.log('ERR:', err);
    showError(err);
  });
}

function requestHubEvents() {
  if (!hubId) {
    return;
  }
  var settings = {
    url: `${serverUrl}/hub/${hubId}/events`,
    headers: {'Authorization': 'JWT {{jwt.token}}'},
    jwt: {
      algorithm: 'HS256',
      secret_key: '{{setting.shared_secret}}',
      expiry: 10,
      claims: {
        iss: 'contactlab-rd'
      }
    },
    secure: true,
    type: 'GET',
    dataType: 'json'
  };

  client.request(settings)
  .then(result => {
    showEvents(result.data || []);
  })
  .catch(err => {
    console.log(err);
  });
}

function saveHubInfo(hubData) {
  var settings = {
    url: `${serverUrl}/hub`,
    headers: {'Authorization': 'JWT {{jwt.token}}'},
    jwt: {
      algorithm: 'HS256',
      secret_key: '{{setting.shared_secret}}',
      expiry: 10,
      claims: {
        iss: 'contactlab-rd'
      }
    },
    secure: true,
    type: 'POST',
    dataType: 'json',
    contentType: 'application/json',
    data: JSON.stringify(hubData)
  };

  client.request(settings)
  .then(result => {
    if (result && result.success) {
      if (result.data) {
        hubId = result.data.id;
        showInfo(result.data);
      } else {
        showNotFound();
      }
    } else {
      showError(result.errorMessage || 'Request processing error');
    }
  })
  .catch(err => {
    console.log('ERR:', err);
    showError(err);
  });
}

function showEvents(events) {
  var source = document.getElementById('events-template').innerHTML;
  formattedEvents = events.map(function(event) {
    var formatted = {
      name: capitalizeFirstLetter(upperCaseToSpace(event.type)),
      date: event.date,
      context: event.context,
      details: []
    };
    var props = event.properties;
    switch (event.type) {
      case 'addedCompare':
      case 'addedProduct':
      case 'addedWishlist':
      case 'removedCompare':
      case 'removedProduct':
      case 'removedWishlist':
      case 'viewedProduct':
        formatted.details = eventProductToProps(props);
      break;
      case 'campaignLinkClicked':
        formatted.details.push({
          name: 'Link',
          value: props.linkId
        });
      case 'campaignBlacklisted':
      case 'campaignBounced':
      case 'campaignMarkedSpam':
      case 'campaignOpened':
      case 'campaignSent':
      case 'campaignUnsubscribed':
        formatted.details.push({
          name: 'Campaign',
          value: props.campaignName
        });
      case 'campaignSubscribed':
        formatted.details.push({
          name: 'List',
          value: props.listName
        });
      break;
      case 'changedSetting':
        formatted.details.push({
          name: 'Setting',
          value: props.setting
        });
        formatted.details.push({
          name: 'Value',
          value: props.newValue
        });
      break;
      case 'clickedLink':
        formatted.details.push({
          name: 'Title',
          value: props.title
        });
      break;
      case 'closedTicket':
      case 'openedTicket':
      case 'repliedTicket':
        formatted.details.push({
          name: 'Ticket ID',
          value: props.ticketId
        });
        formatted.details.push({
          name: 'Subject',
          value: props.subject
        });
      break;
      case 'abandonedCart':
      case 'completedOrder':
        formatted.details.push({
          name: 'Order ID',
          value: props.orderId
        });
        formatted.details.push({
          name: 'Amount',
          value: props.amount?`${props.amount.local?props.amount.local.currency:''} ${props.amount.total}`:''
        });
        formatted.details.push({
          name: 'Products',
          value: props.products.map(function(p){ return eventProductToProps(p); })
        });
      break;
      case 'eventConfirmed':
      case 'eventDeclined':
      case 'eventEligible':
      case 'eventInvited':
      case 'eventNoShow':
      case 'eventNotInvited':
      case 'eventParticipated':
      case 'eventRegistered':
        formatted.details.push({
          name: 'Event name',
          value: props.eventName
        });
        formatted.details.push({
          name: 'Event date',
          value: props.eventDate
        });
        formatted.details.push({
          name: 'Event type',
          value: props.eventType
        });
      break;
      case 'formCompiled':
        formatted.details.push({
          name: 'Form name',
          value: props.formName
        });
      break;
      case 'genericActiveEvent':
      case 'genericPassiveEvent':
        formatted.details.push({
          name: 'Event name',
          value: props.name
        });
      break;
      case 'loggedIn':
      case 'loggedOut':
      break;
      case 'orderShipped':
        formatted.details.push({
          name: 'Order ID',
          value: props.orderId
        });
        formatted.details.push({
          name: 'Shipment type',
          value: props.type
        });
        formatted.details.push({
          name: 'Carrier',
          value: props.carrier
        });
        formatted.details.push({
          name: 'Tracking code',
          value: props.trackingCode
        });
      break;
      case 'reviewedProduct':
        formatted.details = eventProductToProps(props);
        formatted.details.push({
          name: 'Rating',
          value: props.rating
        });
      break;
      case 'searched':
        formatted.details.push({
          name: 'Keyword',
          value: props.keyword
        });
        formatted.details.push({
          name: 'Result count',
          value: props.resultCount
        });
      break;
      case 'serviceSubscribed':
      case 'serviceUnsubscribed':
        formatted.details.push({
          name: 'Service Name',
          value: props.serviceName
        });
      break;
      case 'viewedPage':
        formatted.details.push({
          name: 'Title',
          value: props.title
        });
        formatted.details.push({
          name: 'Url',
          value: props.url
        });
      break;
      case 'viewedProductCategory':
        formatted.details.push({
          name: 'Category',
          value: props.category
        });
      break;
      default:
    }
    return formatted;
  });
  var template = Handlebars.compile(source);
  var html = template({
    events: formattedEvents
  }, {data:{intl:{locales: 'it-IT'}}});
  document.getElementById('events-content').innerHTML = html;

}

function getHubUserAvatar(hubUser) {
  if (hubUser && hubUser.pictureUrl) {
    return hubUser.pictureUrl;
  } else {
    var names = [];
    if (hubUser.base && (hubUser.base.firstName || hubUser.base.lastName)) {
      if (hubUser.base.firstName) {
        names.push(hubUser.base.firstName.toUpperCase().charAt(0));
      }
      if (hubUser.base.lastName) {
        names.push(hubUser.base.lastName.toUpperCase().charAt(0));
      }
    } else if (hubUser.base && hubUser.base.contacts && hubUser.base.contacts.email) {
      names.push(hubUser.base.contacts.email.toUpperCase().charAt(0));
    } else if (hubUser.base && hubUser.base.contacts && hubUser.base.contacts.mobilePhone) {
      names.push(hubUser.base.contacts.mobilePhone.charAt(1));
    }
    if (!names.length) {
      names.push('?');
    }
    return `${'https:/'}/placeholdit.imgix.net/~text?txtsize=16&bg=0061a0&txtclr=ffffff&txt=${names.join('+')}&w=40&h=40&txttrack=0`;
  }
  return '';
}

function showInfo(data) {
  var address = [];
  if (data.base.address) {
    if (data.base.address.street) {
      address.push(data.base.address.street);
    }
    if (data.base.address.zip) {
      address.push(data.base.address.zip);
    }
    if (data.base.address.city) {
      address.push(data.base.address.city);
    }
    if (data.base.address.province) {
      address.push(data.base.address.province);
    }
    if (data.base.address.region) {
      address.push(data.base.address.region);
    }
    if (data.base.address.country) {
      address.push(data.base.address.country);
    }
  }

  var subs = [];
  if (data.base.subscriptions) {
    subs = data.base.subscriptions.filter(function(sub) {
      if (sub.subscribed) {
        return true;
      }
      return false;
    }).map(function(sub) { return sub.name; });
  }

  var requester_data = {
    'id': data.id || '-',
    'title': data.base.title,
    'prefix': data.base.prefix,
    'firstName': data.base.firstName || '-',
    'lastName': data.base.lastName || '',
    'gender': data.base.gender?capitalizeFirstLetter(data.base.gender):data.base.gender,
    'dob': data.base.dob,
    'email': data.base.contacts.email,
    'address': address.join(', '),
    'subscriptions': subs.join(', '),
    'phone': data.base.contacts.phone,
    'mobilePhone': data.base.contacts.mobilePhone,
    'avatarUrl': getHubUserAvatar(data)
  };
  var source = document.getElementById('requester-template').innerHTML;
  var template = Handlebars.compile(source);
  var intlData = {
    locales: 'en-US'
  }
  var html = template(requester_data, {data:{intl:{locales: 'it-IT'}}});
  document.getElementById('profile-content').innerHTML = html;
  var el = document.querySelector('.profile-container');
  el.addEventListener('click', function(event) {
    toggleElementClass('.events-container', 'active', false);
  });
}

function showNotFound() {
  var source = document.getElementById('notfound-template').innerHTML;
  var template = Handlebars.compile(source);
  var html = template({}, {data:{intl:{locales: 'it-IT'}}});
  document.getElementById('profile-content').innerHTML = html;
  var el = document.getElementById('createuser_btn');
  el.addEventListener('click', handleAddUserClick);
}

function showError(response) {
  var error_data = {
    'status': 'ERROR',
    'statusText': response
  };
  var source = document.getElementById('error-template').innerHTML;
  var template = Handlebars.compile(source);
  var html = template(error_data, {data:{intl:{locales: 'it-IT'}}});
  document.getElementById('profile-content').innerHTML = html;
}

function eventProductToProps(prod) {
  var props = ['name', 'sku', 'id', 'price'];
  var result = props.filter(function(p) {
    if (prod[p] !== undefined) {
      return true;
    }
    return false;
  }).map(function(p) {
    return {
      name: p,
      value: `${prod[p]}`
    };
  });
  return result;
}

function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function upperCaseToSpace(str) {
  function upperToSpaceLower(match, offset, string) {
    return (offset > 0 ? ' ' : '') + match.toLowerCase();
  }
  return str.replace(/[A-Z]/g, upperToSpaceLower);
}

function formatDate(date) {
  var cdate = new Date(date);
  var options = {
    year: "numeric",
    month: "short",
    day: "numeric"
  };
  date = cdate.toLocaleDateString("en-us", options);
  return date;
}

function toggleElementClass(elSelector, className, force) {
  var els = document.querySelectorAll(elSelector);
  els.forEach(el => {
    el.classList.toggle(className, force);
  });
}
