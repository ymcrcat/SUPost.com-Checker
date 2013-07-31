// Save this script as `options.js`

// Saves options to localStorage.
function save_options() {
	var input = document.getElementById("polling_interval");
	var pollingInterval = input.value;
	localStorage["polling_interval"] = pollingInterval;

	// Update status to let user know options were saved.
	var status = document.getElementById("status");
	status.innerHTML = "Options Saved.";
	setTimeout(function() {
			status.innerHTML = "";
			}, 750);
}

// Restores select box state to saved value from localStorage.
function restore_options() {
	var pollingInterval = localStorage["polling_interval"];
	if (!pollingInterval) {
		return;
	}
	var input = document.getElementById("polling_interval");
	input.value = pollingInterval;
}

document.addEventListener('DOMContentLoaded', restore_options);
document.querySelector('#save').addEventListener('click', save_options);
