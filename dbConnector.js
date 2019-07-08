const Pool = require('pg').Pool
const prepareValue = require('pg/lib/utils').prepareValue

//TODO Move DB connection credentials to environment variable or secret store
const pool = new Pool({
  user: 'myuser',
  host: 'localhost',
  database: 'trigrams',
  password: 'password',
  port: 5432,
})

const getTexts = (request, response) => {
	pool.query('SELECT name FROM trigramsJson ORDER BY id ASC', (error, results) => {
		if (error) {
			throw error
		}
		response.status(200).json(results.rows)
	})
}
  
const getTextsById = (request, response) => {
	const id = parseInt(request.params.id)
  
	pool.query('SELECT fileSize, trigramsCnt FROM trigramsJson WHERE id = $1', [id], (error, results) => {
		if (error) {
			throw error
		}
		response.status(200).json(results.rows)
	})
}

const createTables = () => {
	const queryText =
	  	`CREATE TABLE IF NOT EXISTS trigramsJson(
			ID SERIAL PRIMARY KEY,
			UUID TEXT, 
			name TEXT,
			path TEXT,
			filesize INT,
			trigramsCnt INT,
			data JSONB
		)`;
  
	pool.query(queryText)
		.then((res) => console.log("table trigramsJson created")) // brianc
		.catch(err => console.error('Error executing query', err.stack))
}

const createText = (jsonObj, cb) => {
	data = prepareValue(jsonObj.data)
	pool.query('INSERT INTO trigramsJson (UUID, name, path, filesize, trigramsCnt, data) VALUES($1, $2, $3, $4, $5, $6)', [jsonObj.UUID, jsonObj.name, jsonObj.path, jsonObj.filesize, jsonObj.trigramsCnt, data], (error, results) => {
		cb(error)
	})
}

const getDataByUUID = (UUID, cb) => {
	pool.query('SELECT data FROM trigramsJson WHERE uuid = $1', [UUID], (error, results) => {
		cb(error, results.rows[0])
	})
}

module.exports = {
	createTables,
	getTexts,
	getTextsById,
	createText,
	getDataByUUID,
}