//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

//Require the dev-dependencies
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../index');
const should = chai.should();
const Pool = require('pg').Pool
const config = require('config')

const pool = new Pool(config.dbConfig)
var UUID = "";

const createTable =
`CREATE TABLE IF NOT EXISTS trigramsJson(
    ID SERIAL PRIMARY KEY,
    UUID TEXT, 
    name TEXT,
    path TEXT,
    filesize INT,
    trigramsCnt INT,
    data JSONB
)`;
const dropTable = 
`DROP TABLE IF EXISTS trigramsJson`

chai.use(chaiHttp);
//Our parent block
describe('Clean DB', () => {
    before((done) => { //Before each test we empty the database
        pool.query(dropTable, (error, results) => {
            if (error){
                throw error;
            }
            pool.query(createTable, (error, results) => {
                if (error){
                    throw error;
                }
            })
            done();
        })
    });
/*
  * Test the /api/v1/upload
  */
    describe('/api/v1/upload', () => {
        it('it should upload a text file and save metadata in DB', (done) => {
            chai.request(server)
                .post('/api/v1/upload')
                .attach('textFile', __dirname + '/test.txt')
                .end((err, res) => {
                    res.should.have.status(200);
                    UUID = res.body.fileID;
                    console.log(UUID);
                    done();
                });
        });
    });

/*
  * Test the /api/v1/texts/:id/generate
  */
    describe('/api/v1/texts/:id/generate', () => {
        it('it should get trigrams text back successfully', (done) => {
            chai.request(server)
                .get(`/api/v1/texts/${ UUID }/generate?maxSize=100&seedWords=I+may`)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.newTrigrams.should.be.eq('I may I wish I may I wish I might');
                    done();
                });
        });
    });
});