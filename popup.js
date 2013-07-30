var postsXpath = '//*[@class="one-result"]';
var requestTimeout = 1000 * 2;

function fetchItems() {
	console.log('fetchItems');
	var xhr = new XMLHttpRequest();
	xhr.overrideMimeType = "text/xml";
	xhr.responseType = "document";
	xhr.open('GET', getSupostUrl(), false); // synchronous request
	xhr.send();

	var xmlDoc = xhr.responseXML;
	console.log(xmlDoc);
	var content = xmlDoc.evaluate(postsXpath,
																xmlDoc.body,
																null,
																XPathResult.ANY_TYPE,
																null);
	console.log(content);
	var content = content.iterateNext();
	return content;
} // end of fetchItems

function addItem(item) {
	var item = document.createElement("div");
	item.type = "text/html";
}

function parseItems(content) {
	while (content) {
		addItem(content);
		var content = content.iterateNext();
	}
}

function onInit() {
	console.log('SUPost popup');
	
	var content = fetchItems();
	parseItems(content);
} // end of onInit();

onInit();
