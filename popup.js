var maxItemsShown = 10;
var postsXpath = '//*[@class="one-result"]';
var requestTimeout = 1000 * 2;
var contentDivId = "content";
var itemsCache = {};

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
	console.log('addItem');
	var item = document.createElement("tr");
	item.type = "text/html";
	var post = content.children[0];
	var itemLink = post["href"];
	var itemDescription = post.innerHTML;

	if (itemLink in itemsCache) {
		console.log('Item ' + itemLink + ' is already cached');
		return;
	}
	else {
		console.log('Item ' + itemLink + ' not cached. Caching...');
		itemsCache[itemLink] = itemDescription;
	}
	
	item.innerHTML = '<a href="' + itemLink + '" target="_blank">' + itemDescription + '</a>';
	document.getElementById(contentDivId).appendChild(item);
}

function saveItemsCache() {
	localStorage.itemsCache = JSON.stringify(itemsCache);
}

function parseItems(content) {
	console.log(itemsCache);
	var itemsCounter = 0;
	var itemContent = content.iterateNext();
	while (itemContent && itemsCounter < maxItemsShown) {
		addItem(itemContent);
		++itemsCounter;
		var itemContent = content.iterateNext();
	}

	saveItemsCache();
}

function onInit() {
	console.log('SUPost popup');
	initCache();
	console.log(itemsCache);
	fetchItems();
} // end of onInit();

onInit();
