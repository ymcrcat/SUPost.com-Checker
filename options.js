var settings = DEFAULT_SETTINGS;

function displayOptionsSaved() {
	// Update status to let user know options were saved.
	var status = document.getElementById("status");
	status.innerHTML = "Options Saved.";
	setTimeout(function() {
			status.innerHTML = "";
			}, 750);
}

// Saves options to localStorage.
function save_options() {
	var pollIntervalMin = document.getElementById("poll_interval_min");
	var pollIntervalMax = document.getElementById("poll_interval_max");
	var requestTimeout = document.getElementById("request_timeout");
	var filterByKeywords = document.getElementById("filter_by_keywords");
	var keywords = document.getElementById("keywords");

	settings.pollIntervalMin = pollIntervalMin.value;
	settings.pollIntervalMax = pollIntervalMax.value;
	settings.requestTimeout = requestTimeout.value;
	settings.filterByKeywords = filterByKeywords.checked;
	settings.keywords = keywords.value;

	saveSettings();
	displayOptionsSaved();
}

// Restores select box state to saved value from localStorage.
function restore_options() {
	restoreSettings();

	var pollIntervalMin = document.getElementById("poll_interval_min");
	var pollIntervalMax = document.getElementById("poll_interval_max");
	var requestTimeout = document.getElementById("request_timeout");
	var filterByKeywords = document.getElementById("filter_by_keywords");
	var keywords = document.getElementById("keywords");

	pollIntervalMin.value = settings.pollIntervalMin;
	pollIntervalMax.value = settings.pollIntervalMax;
	requestTimeout.value = settings.requestTimeout;
	filterByKeywords.checked = settings.filterByKeywords;
	keywords.value = settings.keywords;
}

function cancel() {
	restore_options();
	close();
}

function onInit() {
	console.log('Settings restored');

	document.addEventListener('DOMContentLoaded', restore_options);
	document.querySelector('#clearItemsCache').
		addEventListener('click', clearItemsCache);
	document.querySelector('#save').addEventListener('click', save_options);
	document.querySelector('#cancel').addEventListener('click', cancel);
}

onInit();
