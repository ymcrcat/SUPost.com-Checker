var postsXpath = '//*[@class="one-result"]';
var contentDivId = "content";

function fetchItems() {
	console.log('fetchItems');
	var xhr = new XMLHttpRequest();
	xhr.responseType = "document";
	xhr.overrideMimeType = "text/xml";

	xhr.onreadystatechange = function() {
		if (xhr.readyState != 4) {
			return;
		}

		console.log('Got response');
		var xmlDoc = xhr.responseXML;
		console.log(xmlDoc);
		var content = xmlDoc.evaluate(postsXpath,
																	xmlDoc.body,
																	null,
																	XPathResult.ANY_TYPE,
																	null);
		console.log(content);
		parseItems(content);
	}

	xhr.open('GET', getSupostUrl(), true); // synchronous request
	xhr.send();
} // end of fetchItems

function addItem(content) {
	// console.log('addItem');
	var item = document.createElement("tr");
	item.type = "text/html";
	var post = content.children[0];
	var itemLink = post["href"];
	var itemDescription = post.innerHTML;

	if (itemLink in itemsCache) {
		// console.log('Item ' + itemLink + ' is already cached');
		return false;
	}
	else {
		// console.log('Item ' + itemLink + ' not cached. Caching...');
		itemsCache[itemLink] = itemDescription;
	}
	
	item.innerHTML = '<a href="' + itemLink + '" target="_blank">' 
										+ itemDescription + '</a>';
	document.getElementById(contentDivId).appendChild(item);
	return true;
}

function noItems() {
	console.log("noItems");
	var item = document.createElement("tr");
	item.type = "text/html";
	item.innerHTML = "No new items";

	var div = document.getElementById('content_div');
	var smalldiv = document.createElement('div');
	smalldiv.class = 'small';
	smalldiv.appendChild(item);
	div.parentNode.replaceChild(smalldiv, div);
}

function parseItems(content) {
	console.log(itemsCache);
	var itemsCounter = 0;
	var itemContent = content.iterateNext();
	while (itemContent) {
		var isnew = addItem(itemContent);
		if (isnew) { 
			++itemsCounter;
		}
		var itemContent = content.iterateNext();
	}
	
	if (itemsCounter == 0) {
		noItems();
	}

	// notify background window about cache update
	chrome.runtime.sendMessage({greeting:MSG_ID_UPDATE});
	saveItemsCache();
} // end of parseItems

// Bind gotoSupost() to click on SUPost banner
// If a tab is already open on SUPost it will take
// us to that tab
function bindGotoSupost() {
	var supostLink = document.getElementById('supost_link');
	supostLink.onclick = gotoSupost;
	supostLink.href = '';
	supostLink.target = '';
}

function onInit() {
	console.log('SUPost popup');
	restoreSettings();

	initCache();
	console.log(itemsCache);	
	
	bindGotoSupost();

	fetchItems();
} // end of onInit();

onInit();
