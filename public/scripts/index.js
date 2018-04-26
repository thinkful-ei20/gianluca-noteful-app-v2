/* global $ noteful api store */

$(document).ready(function () {
	noteful.bindEventListeners();

	api.search('/api/notes')
		.then(response => {
			store.notes = response;
			noteful.render();
		});

	console.info('Get folders, coming soon...');
	api.search('/api/folders')
		.then(response => {
			store.folders = response;
			noteful.render();
		});

	console.info('Get tags, coming soon...');
	// api.search('/api/tags')
	//   .then(response => {
	//     store.tags = response;
	//     noteful.render();
	//   });

});

