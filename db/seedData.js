const knex = require('../knex');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

module.exports = function(file, user = 'dev') {
	return exec(`psql -f ${file} ${process.env.TEST_DATABASE_URL}` );
};
