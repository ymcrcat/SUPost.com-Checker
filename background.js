var pollIntervalMin = 1;  // 1 minute
var pollIntervalMax = 10;  // 10 minutes
var iconpath = "favicon.png";
var itemsCache = {};
initCache();

// Legacy support for pre-event-pages.
var oldChromeVersion = !chrome.runtime;
var requestTimerId;

function isSupostUrl(url) {
  // Return whether the URL starts with the SUPost prefix.
  return url.indexOf(getSupostUrl()) == 0;
}

function updateIcon() {
	console.log('updateIcon');
	// Set number of new items on badge
  if (!localStorage.hasOwnProperty('newItemsCount')) {
		console.log('Items count not set');
    chrome.browserAction.setIcon({path:iconpath});
    chrome.browserAction.setBadgeBackgroundColor({color:[190, 190, 190, 230]});
    chrome.browserAction.setBadgeText({text:"?"});
  } else {
		console.log('Items count set to ' + localStorage.newItemsCount);
    chrome.browserAction.setIcon({path: iconpath});
    chrome.browserAction.setBadgeBackgroundColor({color:[208, 0, 24, 255]});
    chrome.browserAction.setBadgeText({
      text: localStorage.newItemsCount != "0" ? localStorage.newItemsCount : ""
    });
  }
	console.log('updateIcon end');
}

function scheduleRequest() {
  console.log('scheduleRequest');
  var randomness = Math.random() * 2;
  var exponent = Math.pow(2, localStorage.requestFailureCount || 0);
  var multiplier = Math.max(randomness * exponent, 1);
  var delay = Math.min(multiplier * pollIntervalMin, pollIntervalMax);
  delay = Math.round(delay);
  console.log('Scheduling for: ' + delay);

  if (oldChromeVersion) {
    if (requestTimerId) {
      window.clearTimeout(requestTimerId);
    }
    requestTimerId = window.setTimeout(onAlarm, delay*60*1000);
  } else {
    console.log('Creating alarm');
    // Use a repeating alarm so that it fires again if there was a problem
    // setting the next alarm.
    chrome.alarms.create('refresh', {periodInMinutes: delay});
  }
}

// ajax stuff
function startRequest(params) {
  // Schedule request immediately. We want to be sure to reschedule, even in the
  // case where the extension process shuts down while this request is
  // outstanding.
	console.log("startRequest");
  if (params && params.scheduleRequest) scheduleRequest();

  getNewItemsCount(
    function(count) {
      updateItemsCount(count);
    },
    function() {
      delete localStorage.newItemsCount;
      updateIcon();
    }
  );
}

function updateItemsCount(count) {
	console.log("updateItemsCount");
  localStorage.newItemsCount = count;
  updateIcon();
}

function goToSupost() {
  console.log('Going to SUPost...');
  chrome.tabs.getAllInWindow(undefined, function(tabs) {
    for (var i = 0, tab; tab = tabs[i]; i++) {
      if (tab.url && isSupostUrl(tab.url)) {
        console.log('Found SUPost tab: ' + tab.url + '. ' +
                    'Focusing and refreshing count...');
        chrome.tabs.update(tab.id, {selected: true});
        startRequest({scheduleRequest:false});
        return;
      }
    }
    console.log('Could not find SUPost tab. Creating one...');
    chrome.tabs.create({url: getSupostUrl()});
  });
}

function onInit() {
  console.log('onInit');

	// reset cache in case we reload the extension
	if (localStorage.hasOwnProperty('itemsCache')) {
		delete localStorage.itemsCache;
	}
	initCache();
	
	updateIcon();
  localStorage.requestFailureCount = 0;  // used for exponential backoff
  startRequest({scheduleRequest:true});
}

function onAlarm(alarm) {
  console.log('Got alarm', alarm);
  // |alarm| can be undefined because onAlarm also gets called from
  // window.setTimeout on old chrome versions.
  startRequest({scheduleRequest:true});
}

if (oldChromeVersion) {
  onInit();
} else {
  chrome.runtime.onInstalled.addListener(onInit);
  chrome.alarms.onAlarm.addListener(onAlarm);
}

// chrome.browserAction.onClicked.addListener(goToSupost);

chrome.browserAction.onClicked.addListener(function() {
		updateItemsCount(0);
	});

if (chrome.runtime && chrome.runtime.onStartup) {
  chrome.runtime.onStartup.addListener(function() {
    console.log('Starting browser... updating icon.');
    startRequest({scheduleRequest:false});
    updateIcon();
  });
} else {
  // This hack is needed because Chrome 22 does not persist browserAction icon
  // state, and also doesn't expose onStartup. So the icon always starts out in
  // wrong state. We don't actually use onStartup except as a clue that we're
  // in a version of Chrome that has this problem.
  chrome.windows.onCreated.addListener(function() {
    console.log('Window created... updating icon.');
    startRequest({scheduleRequest:false});
    updateIcon();
  });
}
