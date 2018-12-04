
const   fs = require('fs');


///////////////////////////////////////////////////////////
//  This is used to index the words alphabetically.
//
//  Any word in the list that doesn't begin with one of
//  these characters is discarded (uppercase is converted
//  to lowercase).
//
const   ALPHACHARS = "abcdefghijklmnopqrstuvwxyz0123456789";


const   ENABLE_CONSOLE = false;


///////////////////////////////////////////////////////////
//  _consoleMsg()
//
//  Simple debugger dumps data to console - you can
//  suppress the output by setting ENABLE_CONSOLE to
//  false.
//
const _consoleMsg = function(msg) {
    if (ENABLE_CONSOLE && typeof(msg) === "string")
        console.log(msg);
};


///////////////////////////////////////////////////////////
//  Returns the ALPHACHARS index of the words initial
//  character.
//
//  Uppercase is converted to lowecase.
const _getAlphaIndex = word => {
    return ALPHACHARS.indexOf(word.substr(0, 1).toLowerCase());
};


///////////////////////////////////////////////////////////
//  The loaded word_list is processed and sorted into a
//  multi-dimensional array and returned.
//
const _processWordlist = (word_list, config) => {
    let maxlen = config.WORD_MAXLEN;
    var words = new Array(maxlen);

///////////////////////////////////////////////////////////
//  Words that are > maxlen or don't start with one of the
//  ALPHACHARS are discarded - keeping a tally of these
//  discareded words.
//
    var discarded = 0;

    var nonalpha = 0;

    for (var len = 0; len < (maxlen + 1); len++) {
        words[len] = [];
        for (var al = 0; al < ALPHACHARS.length; al++) {
            words[len][al] = [];
        }
    }

    word_list.forEach(word => {
        // Words are sorted by length, the actual length being
        // the index of the array where it's stored, so a 10
        // letter word is stored in words[10], 11 letter words
        // in words[11] and so on.
        //
        var wordlen = word.length;

        if (wordlen < maxlen) {
            if (typeof(words[wordlen]) === "undefined")
                words[wordlen] = [];

            // Get the alpha index for this word. Each
            // elements of the words array is another
            // array.
            //
            // So 10 letter words starting with 'a' go
            // in words[10][0], 10 letter words that start
            // with 'b' go in words[10][1] and so on.
            //
            var index = _getAlphaIndex(word);

            if (index > -1) {
                if (typeof(words[wordlen][index]) === "undefined")
                    words[wordlen][index] = [];

                words[wordlen][index].push(word.toLowerCase());
            }
            else
                nonalpha++;
        }
        else
            discarded++;
    });

    var word_count = 0;

    words.map((w_array, index) => {
        if (! index) return;

        w_array.map((_w_array, _index) => {
            if (typeof(_w_array) !== "undefined") {
                _consoleMsg(`Loaded ${_w_array.length} ${index} letter words`);
                word_count += _w_array.length;
            }
        });
    });

    word_count += (discarded + nonalpha);

    _consoleMsg(`Discarded a total of ${discarded} long words.`);
    _consoleMsg(`Discarded a total of ${nonalpha} nonalpha words.`);
    _consoleMsg(`Total words (including discarded): ${word_count}`);

    return words;
};


module.exports.loadWords = config => {
    var word_file = config.WORD_FILE;

    var word_list = fs.readFileSync(word_file, 'utf-8').split(/\r?\n/);

    _consoleMsg(`\
        Loaded word list from ${word_file}, \
        contains ${word_list.length} words -- sorting... \
    `);

    var _words = _processWordlist(word_list, config);

    _consoleMsg(`Sorted words by length into ${_words.length} arrays.`);


    let _getMatch = query => {
        var match;
        var words = [];

        var index = _getAlphaIndex(query);

        query = query.toLowerCase();

        for (var len = (_words.length - 1); len >= 0; len--) {
            if (index < _words[len].length && typeof(_words[len][index]) !== "undefined" || _words[len][index].length == 0) {
                _words[len][index].map(word => {
                    if (query == word.substr(0, query.length).toLowerCase())
                        words.push(word);
                });
            }

            if (words.length > 0)
                break;
        }

        if (! words.length)
            match = "";
        else if (words.length == 1)
            match = words[0];
        else
            match = words[Math.floor(Math.random() * words.length)];

        return match;
    };

    return {
        "words":        _words,
        "getMatch":     _getMatch
    };

};

