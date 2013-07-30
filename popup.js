var postsXpath = '//*[@class="one-result"]';
var requestTimeout = 1000 * 2;
var contentDivId = "content";

function fetchItems() {
	console.log('fetchItems');
	var xhr = new XMLHttpRequest();
	xhr.responseType = "document";
	xhr.overrideMimeType = "text/xml";

	xhr.onreadystatechange = function() {
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
	var item = document.createElement("p");
	item.type = "text/html";
	var post = content.children[0];
	var itemLink = post["href"];
	var itemDescription = post.innerHTML;
	item.innerHTML = itemDescription;
	document.getElementById(contentDivId).appendChild(item);
}

function parseItems(content) {
	var itemContent = content.iterateNext();
	while (itemContent) {
		addItem(itemContent);
		var itemContent = content.iterateNext();
	}
}

function onInit() {
	console.log('SUPost popup');
	fetchItems();
} // end of onInit();

onInit();
