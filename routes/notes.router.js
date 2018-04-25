

const express = require('express');

// Create an router instance (aka "mini-app")
const router = express.Router();

// knex SQL library, already set with our knexfile.js "configuration"
const knex = require('../knex');

// Get All (and search by query)
router.get('/notes', (req, res, next) => {
	const searchTerm = req.query.searchTerm;

	knex.select('notes.id', 'title', 'content').from('notes')
		.modify(function (queryBuilder) {
			if (searchTerm) {
				queryBuilder.where('title', 'like', `%${searchTerm}%`);
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

	knex
		.select()
		.from('notes')
		.where('id', `${id}`)
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

	knex
		.update(updateObj)
		.from('notes')
		.where('id',`${id}`)
		.returning(['id','title','content','created'])
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
	const { title, content } = req.body;

	/***** Never trust users - validate input *****/
	if (!title) {
		const err = new Error('Missing `title` in request body');
		err.status = 400;
		return next(err);
	}

	knex
		.insert({title, content})
		.into('notes')
		.returning(['id', 'title', 'content', 'created'])
		.then(results => {
			if(results.length > 0)
				res.status(201).json(results[0]);
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
