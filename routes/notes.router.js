const express = require('express');

// Create an router instance (aka "mini-app")
const router = express.Router();

// knex SQL library, already set with our knexfile.js "configuration"
const knex = require('../knex');

const hydrateNotes = require('../utils/hydrateNotes');

// Get All (and search by query)
router.get('/notes', (req, res, next) => {
	const {searchTerm, folderId, tagId} = req.query;

	knex('notes')
		.select('notes.id', 'title', 'content',
			'folders.id as folder_id', 'folders.name as folderName',
			'tags.id as tagId','tags.name as tagName')
		.leftJoin('folders', 'notes.folder_id', 'folders.id')
		.leftJoin('notes_tags', 'notes_tags.note_id', 'notes.id')
		.leftJoin('tags','notes_tags.tag_id', 'tags.id')
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
		.modify(function (queryBuilder) {
			if (tagId) {
				queryBuilder.where('tag_id', tagId);
			}
		})
		.orderBy('notes.id')
		.then(results => {
			console.log(results);
			if(results) {
				const hydrated = hydrateNotes(results);
				res.json(hydrated);
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
		.select('notes.id', 'title', 'content',
			'folders.id as folder_id', 'folders.name as folderName',
			'tags.id as tagId','tags.name as tagName')
		.leftJoin('folders', 'notes.folder_id', 'folders.id')
		.leftJoin('notes_tags', 'notes_tags.note_id', 'notes.id')
		.leftJoin('tags','notes_tags.tag_id', 'tags.id')
		.where('notes.id', id)
		.then(results => {
			if(results.length > 0) {
				const hydrated = hydrateNotes(results);
				res.json(hydrated[0]);
			} else {
				next();
			}
		})
		.catch(err => next(err));
});

// Put update an item
router.put('/notes/:id', (req, res, next) => {
	const id = req.params.id;
	const { tags = [] } = req.body;

	/***** Never trust users - validate input *****/
	const updateObj = {};
	const updateableFields = ['title', 'content', 'folder_id'];

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
		.where('id', id)
		.then(([id]) => {
			if(id) {
				noteId = id;
				return knex('notes_tags')
					.del()
					.where('note_id', noteId);
			}
			next();

		})
		.then(() => {
			const tagsInsert = tags.map(tagId => ({ note_id: noteId, tag_id: tagId }));
			return knex('notes_tags')
				.insert(tagsInsert);
		})
		.then(() => {
			return knex('notes')
				.select('notes.id', 'title', 'content',
					'folders.id as folder_id', 'folders.name as folderName',
					'tags.id as tagId', 'tags.name as tagName')
				.leftJoin('folders', 'notes.folder_id', 'folders.id')
				.leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
				.leftJoin('tags', 'tags.id', 'notes_tags.tag_id')
				.where('notes.id', noteId);
		})
		.then(result => {
			if (result) {
			// Hydrate the results
				const hydrated = hydrateNotes(result)[0];
				// Respond with a location header, a 201 status and a note object
				res.location(`${req.originalUrl}/${hydrated.id}`).status(200).json(hydrated);
			} else {
				next();
			}
		})
		.catch(err => next(err));
});

// Post (insert) an item
router.post('/notes', (req, res, next) => {
	const { title, content, folder_id, tags = [] } = req.body;

	/***** Never trust users - validate input *****/
	if (!title) {
		const err = new Error('Missing `title` in request body');
		err.status = 400;
		return next(err);
	}

	const newItem = {
		title: title,
		content: content,
		folder_id: folder_id,  // Add `folder_id`
	};

	let noteId;

	knex('notes')
		.insert(newItem, 'id')
		.then(([id]) => {
			// Insert related tags into notes_tags table
			noteId = id;
			const tagsInsert = tags.map(tagId => ({ note_id: noteId, tag_id: tagId }));
			return knex.insert(tagsInsert).into('notes_tags');
		})
		.then(() => {
			// Select the new note and leftJoin on folders and tags
			return knex('notes')
				.select('notes.id', 'title', 'content',
					'folders.id as folder_id', 'folders.name as folderName',
					'tags.id as tagId', 'tags.name as tagName')
				.leftJoin('folders', 'notes.folder_id', 'folders.id')
				.leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
				.leftJoin('tags', 'tags.id', 'notes_tags.tag_id')
				.where('notes.id', noteId);
		})
		.then(result => {
			if (result) {
			// Hydrate the results
				const hydrated = hydrateNotes(result)[0];
				// Respond with a location header, a 201 status and a note object
				res.location(`${req.originalUrl}/${hydrated.id}`).status(201).json(hydrated);
			} else {
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
