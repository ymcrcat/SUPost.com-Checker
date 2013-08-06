//////////////////////// MESSAGES //////////////////////
var MSG_ID_UPDATE = 'update';

//////////////////////// SETTINGS //////////////////////
var settingsKey = 'settings';

var DEFAULT_SETTINGS = {
	'requestTimeout' 		: 1000 * 2, // 2 seconds
	'pollIntervalMin' 	: 1,
	'pollIntervalMax' 	: 60,
	'filterByKeywords' 	: false,
	'keywords'					: '',
	'popupBgColor'			: '#FFFFFF'
};

var settings = DEFAULT_SETTINGS;

function saveSettings()
{
	console.log('Saving settings...');
	localStorage[settingsKey] = JSON.stringify(settings);
	console.log(settings);
}

function restoreSettings()
{
	console.log('Restoring settings...');
	if (localStorage.hasOwnProperty(settingsKey)) {
		settings = JSON.parse(localStorage[settingsKey]);
		console.log(settings);
	}
	else {
		saveSettings();
	}
} // restoreOptions

restoreSettings();

/////////////////////// Items Cache ////////////////////

var itemsCache = {};

function initCache() {
	if (!localStorage.hasOwnProperty('itemsCache')) {
		console.log('Items cache does not exist in local storage.');
	}
	else {
		console.log('Items cache already exists');
		itemsCache = JSON.parse(localStorage.itemsCache);
	}
}

function saveItemsCache() {
	localStorage.itemsCache = JSON.stringify(itemsCache);
}

function clearItemsCache() {
	if (localStorage.hasOwnProperty('itemsCache')) {
		delete localStorage.itemsCache;
	}
	
	initCache();
}

// make sure we restore the cache from local storage 
// after we define the itemsCache variable as {}
initCache();

/////////////////////////////////////////////////////////////

function getPostIndexFromLink(link) {
	parts = link.split('/');
	return parts[parts.length-1];
}

// XPath to recent post elements on SUPost homepage
var recentPostsXpath = '//*[@class="one-result"]';

function getSupostUrl() {
  return "http://www.supost.com/";
}

function isSupostUrl(url) {
  // Return whether the URL starts with the SUPost prefix.
  return url.indexOf('supost.com') >= 0;
}

// Return true for an item containing one of the 
// keywords and false otherwise
function filterItem(description) {
	var keywords = settings.keywords.split(/[ ,]+/);
	for (i = 0; i < keywords.length; ++i) {
		var keyword = keywords[i].trim()
		if (keyword.length > 0 && 
				description.match(new RegExp(keyword, 'i'))) {
			return true;
		}
	}

	return false;
} // filterByKeywords

function getNewItemsCount(onSuccess, onError) {
	console.log('getNewItemsCount');
  var xhr = new XMLHttpRequest();
  var abortTimerId = window.setTimeout(function() {
    xhr.abort();  // synchronously calls onreadystatechange
  }, settings.requestTimeout);

  function handleSuccess(content) {
		var count = 0;
		var item = content.iterateNext();
		while (item) {
			var itemContent = item.children[0];
			itemLink = itemContent["href"];
			itemDescription = itemContent.innerHTML;

			if (settings.filterByKeywords && !filterItem(itemDescription)) {
				// doesn't match filter, skip item
				item = content.iterateNext();
				continue;
			}

			if (itemLink in itemsCache) {
				console.log('Item ' + itemLink + ' is already in cache');
			}
			else {
				++count;
			}
		
			item = content.iterateNext();	
		}

		console.log('handleSuccess: ' + count);
    localStorage.requestFailureCount = 0;
    window.clearTimeout(abortTimerId);
    if (onSuccess) {
      onSuccess(count);
		}

		saveItemsCache();
  }

  var invokedErrorCallback = false;
  function handleError() {
    ++localStorage.requestFailureCount;
    window.clearTimeout(abortTimerId);
    if (onError && !invokedErrorCallback) {
      onError();
		}
    invokedErrorCallback = true;
  }

  try {
    xhr.onreadystatechange = function() {
      if (xhr.readyState != 4) {
        return;
			}

			console.log('Got response. Type: ' + xhr.responseType);

      if (xhr.responseXML) {
        var xmlDoc = xhr.responseXML;
				console.log(xmlDoc);
        var fullCountSet = xmlDoc.evaluate(recentPostsXpath,
																					 xmlDoc.body,
																					 null, 
																					 XPathResult.ANY_TYPE,
																					 null);
				console.log(fullCountSet);
        if (fullCountSet) {
					console.log('Item found');
          handleSuccess(fullCountSet);
          return;
        } else {
          console.error(chrome.i18n.getMessage("supost_node_error"));
        }
      }

      handleError();
    };

    xhr.onerror = function(error) {
      handleError();
    };

		console.log('Fetching HTML...');

		xhr.overrideMimeType = "text/xml";
		xhr.responseType = "document";
    xhr.open("GET", getSupostUrl(), true);
    xhr.send();
  } catch(e) {
    console.error(chrome.i18n.getMessage("supost_exception", e));
    handleError();
  }
} // getNewItemsCount
