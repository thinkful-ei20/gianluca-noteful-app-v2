
const express = require('express');

// Create an router instance (aka "mini-app")
const router = express.Router();

// knex SQL library, already set with our knexfile.js "configuration"
const knex = require('../knex');

// Get All (and search by query)
router.get('/notes', (req, res, next) => {
	const {searchTerm, folderId} = req.query;

	knex('notes')
		.select('notes.id', 'title', 'content', 'folders.id as folder_id', 'folders.name as folderName')
		.leftJoin('folders', 'notes.folder_id', 'folders.id')
		.modify(function (queryBuilder) {
			if (searchTerm) {
				queryBuilder.where('title', 'like', `%${searchTerm}%`);
			}
		})
		.modify(function(queryBuilder) {
			if(folderId) {
				queryBuilder.where('folder_id', folderId);
			}
		})
		.orderBy('notes.id')
		.then(results => {
			if(results) {
				res.json(results);
			} else {
				next();
			}
		})
		.catch(err => next(err));
});

// Get a single item
router.get('/notes/:id', (req, res, next) => {

	const id = req.params.id;

	knex('notes')
		.select('notes.id', 'title', 'content', 'folders.id as folder_id', 'folders.name as folderName')
		.leftJoin('folders', 'notes.folder_id', 'folders.id')
		.where('notes.id', id) /* ambiguity with id, so used 'notes.id' */
		.then(results => {
			if(results.length > 0) {
				res.json(results[0]);
			} else {
				next();
			}
		})
		.catch(err => next(err));
});

// Put update an item
router.put('/notes/:id', (req, res, next) => {
	const id = req.params.id;

	/***** Never trust users - validate input *****/
	const updateObj = {};
	const updateableFields = ['title', 'content'];

	updateableFields.forEach(field => {
		if (field in req.body) {
			updateObj[field] = req.body[field];
		}
	});

	/***** Never trust users - validate input *****/
	if (!updateObj.title) {
		const err = new Error('Missing `title` in request body');
		err.status = 400;
		return next(err);
	}

	let noteId;

	knex('notes')
		.update(updateObj, 'id')
		.where('id',id)
		.then(([id]) => {
			noteId = id;
			return knex('notes')
				.select('notes.id', 'title', 'content', 'folder_id', 'folders.name as folder_name')
				.leftJoin('folders', 'notes.folder_id', 'folders.id')
				.where('notes.id', noteId);
		})
		.then(results => {
			if(results.length > 0) {
				res.json(results[0]);
			} else {
				next();
			}
		})
		.catch(err => next(err));
});

// Post (insert) an item
router.post('/notes', (req, res, next) => {
	const { title, content, folder_id } = req.body;

	/***** Never trust users - validate input *****/
	if (!title) {
		const err = new Error('Missing `title` in request body');
		err.status = 400;
		return next(err);
	}

	const newItem = {
		title: title,
		content: content,
		folder_id: folder_id  // Add `folder_id`
	};

	let noteId;

	knex('notes')
		.insert(newItem,'id')
		.then(([id]) => {

			noteId = id;

			return knex.select('notes.id', 'title', 'content', 'folder_id', 'folders.name as folder_name')
				.from('notes')
				.leftJoin('folders', 'notes.folder_id', 'folders.id')
				.where('notes.id', noteId);
		})
		.then(results => {
			if(results.length > 0)
				res.location(`${req.originalUrl}/${results[0].id}`).status(201).json(results[0]);
			else {
				next();
			}
		})
		.catch(err => next(err));
});

// Delete an item
router.delete('/notes/:id', (req, res, next) => {
	const id = req.params.id;

	knex
		.del()
		.from('notes')
		.where('id',`${id}`)
		.then(result => {
			if(result >= 1) {
				res.sendStatus(204);
			} else {
				next();
			}
		})
		.catch(err => next(err));
});

module.exports = router;
