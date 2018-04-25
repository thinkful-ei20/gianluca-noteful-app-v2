
const knex = require('../knex');

// Get All Notes accepts a searchTerm and finds notes with titles which contain the term. It returns an array of objects.

let searchTerm = 'gaga';
knex
	.select('notes.id', 'title', 'content')
	.from('notes')
	.modify(queryBuilder => {
		if (searchTerm) {
			queryBuilder.where('title', 'like', `%${searchTerm}%`);
		}
	})
	.orderBy('notes.id')
	.then(results => {
		console.log(JSON.stringify(results, null, 2));
	})
	.catch(err => {
		console.error(err);
	});



// Get Note By Id accepts an ID. It returns the note as an object not an array

let id = '1000';
knex
	.select()
	.from('notes')
	.where('id',`${id}`)
	.then(results => {
		console.log(results[0]);
	})
	.catch(err => {
		console.log(err);
	});

// Update Note By Id accepts an ID and an object with the desired updates. 
// It returns the updated note as an object

let id2 = '1003';
let updateObj = {
	title:'new title',
	content:'new content'
};

knex
	.update(updateObj)
	.from('notes')
	.where('id',`${id2}`)
	.returning(['id','title','content','created'])
	.then(results => {
		console.log(results[0]);
	})
	.catch(err => {
		console.log(err);
	});

// Create a Note accepts an object with the note properties and inserts it in the DB.
// It returns the new note (including the new id) as an object.

let newObj = {
	title:'new title',
	content:'new content'
};

knex
	.insert([newObj])
	.into('notes')
	.returning(['id', 'title', 'content', 'created'])
	.then(results => {
		console.log(results[0]);
	})
	.catch(err => {
		console.log(err);
	});

// Delete Note By Id accepts an ID and deletes the note from the DB.

knex
	.delete()
	.from('notes')
	.where('id',`${1012}`)
	.then(results => {
		console.log(`${results} item deleted!`);
	})
	.catch(err => {
		console.log(err);
	});
