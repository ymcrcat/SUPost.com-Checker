var postPhotosXpath = '//*[@class="post_photos"]';
var contentDivId = "content";

function addItem(content) {
	// console.log('addItem');
	var item = document.createElement("tr");
	item.type = "text/html";
	var post = content.children[0];
	var itemLink = post["href"];
	var itemDescription = post.innerHTML;

	if (itemLink in itemsCache) {
		// console.log('Item ' + itemLink + ' is already cached');
		item.innerHTML = '<a href="' + itemLink + '" target="_blank">' 
			+ itemDescription + '</a>';
		document.getElementById('old_items').appendChild(item);
		return false;
	} // old item
	else {
		// console.log('Item ' + itemLink + ' not cached. Caching...');
		itemsCache[itemLink] = itemDescription;
		item.innerHTML = '<a href="' + itemLink + '" target="_blank">' 
			+ itemDescription + '</a>';
		document.getElementById(contentDivId).appendChild(item);
		return true;
	} // new item
} // end of addItem

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
		var itemDescription = itemContent.children[0].innerHTML;
		if (settings.filterByKeywords && !filterItem(itemDescription)) {
			// doesn't match filter, skip item
			itemContent = content.iterateNext();
			continue;
		}

		var isnew = addItem(itemContent);
		if (isnew) { 
			++itemsCounter;
		}
		var itemContent = content.iterateNext();
	}
	
	/*
	if (itemsCounter == 0) {
		noItems();
	}
	*/

	// notify background window about cache update
	if (chrome.runtime) {
		// if not old Chrome version
		chrome.runtime.sendMessage({greeting:MSG_ID_UPDATE});
	}
	saveItemsCache();
} // end of parseItems

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
} // gotoSupost

// Bind gotoSupost() to click on SUPost banner
// If a tab is already open on SUPost it will take
// us to that tab
function bindGotoSupost() {
	var supostLink = document.getElementById('supost_link');
	supostLink.onclick = gotoSupost;
	supostLink.href = '';
	supostLink.target = '';
}

function showPhotos(xmlDoc) {
	console.log('showPhotos');
	var photosDiv = xmlDoc.evaluate(postPhotosXpath,
																	xmlDoc.body,
																	null,
																	XPathResult.ANY_TYPE,
																	null);
	var photos = photosDiv.iterateNext();
	if (!photos) {
		console.log('No post photos');
		return;
	}
	
	console.log(photos);
	console.log(photos.children.length + ' post photos');
	// weird stuff. we shouldn't do i++
	for (var i = 0, photo; photo = photos.children[i];) {
		console.log(photo);
		// strange shit but works, when we actually assign the
		// 'src' to 'src' the link is updated with the correct base
		photo.children[0].children[0]['src'] =
			photo.children[0].children[0]['src'];

		// update a href
		photo.children[0]['href'] = photo.children[0]['href'];
		photo.children[0]['target'] = '_blank';

		photo.children[0].children[0]['height'] = '70';
		photo.removeChild(photo.children[2]);
		photo.removeChild(photo.children[1]);
		document.getElementById('post_photos').appendChild(photo);
		console.log(i);
	}
} // showPhotos

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
		var content = xmlDoc.evaluate(recentPostsXpath,
																	xmlDoc.body,
																	null,
																	XPathResult.ANY_TYPE,
																	null);
		console.log(content);
		parseItems(content);

		showPhotos(xmlDoc);
	} // on ready

	xhr.open('GET', getSupostUrl(), true); // synchronous request
	xhr.send();
} // end of fetchItems

function refresh() {
	location.reload(true);
}

function chageImageOnHover(id, mouseover_img, mouseout_img) {
	var elem = document.getElementById(id);
	elem.onmouseover = function() {
		elem.src = mouseover_img;
	};
	
	elem.onmouseout = function() {
		elem.src = mouseout_img;
	};
}

function onInit() {
	console.log('SUPost popup');
	restoreSettings();
	document.bgColor = settings.popupBgColor;

	initCache();
	console.log(itemsCache);	
	
	bindGotoSupost();

	fetchItems();

	chageImageOnHover('refresh', 'images/refresh.png', 'images/refresh-bw.png');
	chageImageOnHover('options', 'images/Setting-icon.png', 
										'images/Setting-icon-bw.png');

	document.querySelector('#refresh').addEventListener('click', refresh);
} // end of onInit();

onInit();
