const fs = require('fs');
const path = require('path');
const uuidv1 = require('uuid/v1');

const n = 3

function readText(filePath){
    try {
        fileContents = fs.readFileSync(filePath);
        return clean(fileContents.toString('utf8'));
    } catch (err) {
        return err; 
    }
}

// TODO more sophisticated clean method 
function clean(text) {
    // remove any char, except for digit, letter or underscore
    var str = text.replace(/[^\w\s]/g, "").replace(/\s+/g, " ");
    str = str.trim();
    if (str.length === 0) {
        return new Error("no valid content exists in the file");
    }
    var strArr = str.split(' ');
    if (strArr.length < 3){
        return new Error("not enough valid words exists in the file");
    }
    return strArr
}

function genKeyVals(filePath) {
    var sequence = readText(filePath);
    if (sequence instanceof Error) {
        return sequence;
    }

    // Get maximum number of trigrams
    var count = Math.max(0, sequence.length - n + 1);

    var keyVals = new Map();
    // Build the trigrams keyVals
    for (let i = 0; i < count; i++) {
        var key = sequence[i] + " " + sequence[i + 1];
        var val = sequence[i + 2];
        if (keyVals.has(key)){
            keyVals.get(key).add(val);
        }else{
            keyVals.set(key, new Set([val]));
        }
    }

    if (keyVals.size === 0){
        return new Error("No valid");
    }

    var keyValObj = new Object();
    keyVals.forEach((val, key) =>{
        keyValObj[key] = Array.from(val);
    })

    return keyValObj;
}

// build up JSON object which will be saved in DB
var trigramsAnalysis = function(filePath, next) {
    var result = new Object();

    var keyVals = genKeyVals(filePath)
    if (keyVals instanceof Error) {
        return keyVals;
    }
    result.data = keyVals;

    result.UUID = uuidv1();

    result.name = path.basename(filePath);

    var stats = fs.statSync(filePath)
    var fileSizeInBytes = stats["size"]
    result.filesize = fileSizeInBytes

    result.path = filePath
    // TODO what is trigramsCnt 
    result.trigramsCnt = 0

    return next(null, result);
};

var generateText = function(maxSize, seedWords, data) {
    var keyVals = new Map();
    for (let [key, value] of Object.entries(data)) {
        keyVals.set(key, value);
    }

    var result = '';
    if (keyVals.has(seedWords)){
        result = seedWords + " ";
    }
    var newKey = seedWords;
    // TODO: there maybe different ways to generate the text.
    while (keyVals.has(newKey) && result.length < maxSize + 1){
        var valArr = keyVals.get(newKey);
        var valArrFirstItem = valArr[0];
        result += valArrFirstItem + " ";
        if (valArr.length > 1){
            valArr.shift();
        }
        keyVals.set(newKey, valArr);
        newKey = newKey.split(' ')[1] + " " + valArrFirstItem
    }

    result = result.trim();
    if (result.length > maxSize){
        result.substring(0, maxSize);
    }

    return result;
}

module.exports = {
    trigramsAnalysis,
    generateText,
    genKeyVals
}