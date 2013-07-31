var recentPostsXpath = '//*[@class="one-result"]';
var requestTimeout = 1000 * 2;  // 2 seconds


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

function getSupostUrl() {
  return "http://www.supost.com/";
}

function isSupostUrl(url) {
  // Return whether the URL starts with the SUPost prefix.
  return url.indexOf('supost.com') >= 0;
}

function gotoSupost() {
  console.log('Going to SUPost...');
  chrome.tabs.getAllInWindow(undefined, function(tabs) {
    for (var i = 0, tab; tab = tabs[i]; i++) {
      if (tab.url && isSupostUrl(tab.url)) {
        console.log('Found SUPost tab: ' + tab.url + '. ' +
                    'Focusing and refreshing count...');
        chrome.tabs.update(tab.id, {selected: true});
        return;
      }
    }
    console.log('Could not find SUPost tab. Creating one...');
    chrome.tabs.create({url: getSupostUrl()});
  });
}

function getNewItemsCount(onSuccess, onError) {
	console.log('getNewItemsCount');
  var xhr = new XMLHttpRequest();
  var abortTimerId = window.setTimeout(function() {
    xhr.abort();  // synchronously calls onreadystatechange
  }, requestTimeout);

  function handleSuccess(content) {
		var count = 0;
		var item = content.iterateNext();
		while (item) {
			var itemContent = item.children[0];
			itemLink = itemContent["href"];
			itemDescription = itemContent.innerHTML;
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
    if (onError && !invokedErrorCallback)
      onError();
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
}
