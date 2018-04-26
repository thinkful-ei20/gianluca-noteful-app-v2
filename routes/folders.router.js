
const express = require('express');
const router = express.Router();
const knex = require('../knex');


router.get('/folders', (req, res, next) => {
	knex.select('id', 'name')
		.from('folders')
		.then(results => {
			res.json(results);
		})
		.catch(err => next(err));
});

router.get('/folders/:id', (req, res, next) => {
	const id = req.params.id;
	knex('folders')
		.select('id', 'name')
		.where('id', id).first()
		.then(result => {
			res.json(result);
		})
		.catch(err => next(err));
});

router.post('/folders', (req, res, next) => {

	const {name} = req.body;

	if (!name) {
		const err = new Error('Missing `title` in request body');
		err.status = 400;
		return next(err);
	}

	knex('folders')
		.insert({name}, ['id', 'name'])
		.then(result => {
			if(result[0]) {
				res.json(result[0]);
			} else {
				next();
			}
		})
		.catch(err => next(err));
});

router.put('/folders/:id', (req, res, next) => {
	const id = req.params.id;

	const {name} = req.body;
	const updateObj = {name:name};

	/***** Never trust users - validate input *****/
	if (!updateObj.name) {
		const err = new Error('Missing `name` in request body');
		err.status = 400;
		return next(err);
	}

	knex('folders')
		.update(updateObj, ['id', 'name'])
		.where('id', id)
		.then(results => {
			if(results.length > 0) {
				res.json(results[0]);
			} else {
				next();
			}
		})
		.catch(err => next(err));
});

router.delete('/folders/:id', (req, res, next) => {

	const id = req.params.id;

	knex('folders')
		.del()
		.where('id', id)
		.then(result => {
			if(result) {
				res.sendStatus(204);
			} else {
				next();
			}
		})
		.catch(err => {
			next(err);
		});
});

module.exports = router;
