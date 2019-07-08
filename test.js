const assert = require('assert');
const trigrams = require('./trigrams')

it('should return true if generate valid trigram', function(){
    // arrange
    var data = trigrams.genKeyVals(__dirname + '/test.txt');
    // act
    var trigram = trigrams.generateText(100, 'I may', data)
    // assert
    assert.equal(trigram, "I may I wish I may I wish I might");
});