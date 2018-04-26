
const express = require('express');
const router = express.Router();
const knex = require('../knex');

router.get('/tags', (req,res,next) => {
	knex.select('id', 'name')
	.from('tags')
	.then(results => {
		res.json(results);
	})
	.catch(err => next(err));
});

router.get('/tags/:id', (req,res,next) => {
	const id = req.params.id;
	knex('tags')
		.select('id', 'name')
		.where('id', id).first()
		.then(result => {
			if(result){
				res.json(result);
			}	
			next();
		})
		.catch(err => next(err));
});

router.post('/tags',(req,res,next) => {
	const { name } = req.body;

	/***** Never trust users. Validate input *****/
	if (!name) {
		const err = new Error('Missing `name` in request body');
		err.status = 400;
		return next(err);
	}

	console.log(name);

	knex('tags')
		.select('name')
		.where('name', name)
		.then(result => {
			if(!result) {
				return knex
				.insert({name},['id','name'])
				.into('tags')
			} else {
				const err = new Error('Cannot use duplicate `tag` : `name` in request body');
				err.status = 409;
				return next(err);
			}
		})
		.then((results) => {
			// Uses Array index solution to get first item in results array
			const result = results[0];
			res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
		})
		.catch(err => next(err));
});

router.put('/tags/:id', (req,res,next) => {
	const id = req.params.id;

	const {name} = req.body;
	const updateObj = {name:name};

	/***** Never trust users - validate input *****/
	if (!updateObj.name) {
		const err = new Error('Missing `name` in request body');
		err.status = 400;
		return next(err);
	}

	knex('tags')
		.select('name')
		.where('name', name)
		.then(result => {
			if(!result) {
				return knex('tags')
				.update(updateObj, ['id', 'name'])
				.where('id', id);
			} else {
				const err = new Error('Cannot use duplicate `tag` : `name` in request body');
				err.status = 409;
				return next(err);
			}
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

router.delete('/tags/:id', (req, res, next) => {

	const id = req.params.id;

	knex('tags')
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
