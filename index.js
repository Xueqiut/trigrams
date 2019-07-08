const express = require('express')
const bodyParser = require('body-parser')
const db = require('./dbConnector')
const busboy = require('connect-busboy');
const fs = require('fs');
const multer = require('multer')
const path = require('path');
const trigrams = require('./trigrams')
const app = express()
const port = 3000

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
)

app.use(busboy({
    highWaterMark: 2 * 1024 * 1024, // Set 2MiB buffer
}))

var upload = multer({
    // reject the invalid files
    fileFilter: (req, file, callback) => {
        var ext = path.extname(file.originalname)
        if(ext !== '.csv' && ext !== '.txt') {
            return callback(null, false);
        }
        if (!file || file.size === 0) {
            return callback(null, false);
        }
        callback(null, true);
    },
    // save the valid file into folder ./uploads with name Date.now()-file.originalname
    storage: multer.diskStorage({
        destination: 'uploads',
        filename: function (req, file, callback) {
            callback(null, Date.now() + '-' +  file.originalname);
        }
    })
}).single('textFile')

// TODO timeout the large file upload
app.post('/api/v1/upload', upload, (req, res) => {
    const file = req.file;
    if (!file) {
        return res.status(404).send('No File uploaded');
    }

    trigrams.trigramsAnalysis(req.file.path, (err, result) => {
        if (err){
            return res.status(500).send(err.message);
        }
        else{
            db.createText(result, (err) => {
                if (err){
                    return res.status(500).send(err.message);
                }
                else{
                    return res.status(200).json({"fileID" : result.UUID});
                    //res.status(200).send(result);
                }
            });
        }
    });
});

// When upload big files, we need to stream the file directly to the disk while we are getting the data.
// https://pagep.net/2018/03/31/how-to-handle-large-file-upload-with-nodejs-express-server/
app.post('/api/v1/uploadBigFile', (req, res, next) => {
    const uploadPath = path.join(__dirname, 'uploads/');
    req.pipe(req.busboy); // Pipe it trough busboy

    req.busboy.on('file', (fieldname, file, filename) => {
        console.log(`Upload of '${filename}' started`);

        // Create a write stream of the new file
        const fstream = fs.createWriteStream(path.join(uploadPath, filename));
        // Pipe it trough
        file.pipe(fstream);

        // On finish of the upload
        fstream.on('close', () => {
            console.log(`Upload of '${filename}' finished`);
            res.status(200).end();
        });
    });
});

// GET /texts/:id/generate?maxSize&seedWords
app.get('/api/v1/texts/:id/generate', (req, res) => {
    const id = req.params.id;
    const maxSize = req.query.maxSize;//parseInt();
    var seedWords = req.query.seedWords;

    if (maxSize == undefined || seedWords == undefined){
        return res.status(400).end("query string maxSize or seedWords miss");
    }

    db.getDataByUUID(id, (err, result) => {
        if (err){
            return res.status(500).send(err.message);
        }
        else{
            seedWords = seedWords.replace('+', ' ');
            var newText = trigrams.generateText(maxSize, seedWords, result.data);
            return res.status(200).send(newText);
        }
    });

    console.log('');
})

app.get('/api/v1/texts', db.getTexts)
app.get('/api/v1/texts/:id', db.getTextsById)

app.listen(port, () => {
    db.createTables();
    console.log(`Server running on port ${port}.`);
})