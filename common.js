var recentPostsXpath = '//*[@id="recentPosts"]';
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

function getSupostUrl() {
  return "http://www.supost.com/";
}

function getNewItemsCount(onSuccess, onError) {
	console.log('getNewItemsCount');
  var xhr = new XMLHttpRequest();
  var abortTimerId = window.setTimeout(function() {
    xhr.abort();  // synchronously calls onreadystatechange
  }, requestTimeout);

  function handleSuccess(content) {
		count = content.children.length;
		console.log('handleSuccess: ' + count);
    localStorage.requestFailureCount = 0;
    window.clearTimeout(abortTimerId);
    if (onSuccess) {
      onSuccess(count);
		}
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
				console.log(recentPostsXpath);
        var fullCountSet = xmlDoc.evaluate(recentPostsXpath,
																					 xmlDoc.body,
																					 null, 
																					 XPathResult.ANY_TYPE,
																					 null);
				console.log(fullCountSet);
        var fullCountNode = fullCountSet.iterateNext();
        if (fullCountNode) {
					console.log('Item found');
          handleSuccess(fullCountNode);
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
