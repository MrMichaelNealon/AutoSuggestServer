/**********************************************************
 */

// Node-specific requires
    const   express = require('express'),
            bodyParser = require('body-parser'),
            path = require('path'),
            cors = require('cors');


    const   app = express();

    
//  Middleware
    app.use(bodyParser.urlencoded({'extended': false}));
    app.use(bodyParser.json());

    app.use(cors());


// Application specific requires
    const   config = require(path.join(__dirname, "./modules/config.js"));
    const   words = require(path.join(__dirname, "./modules/loadwords.js"));

//  loadWords returns the loaded, sorted wordlist -- see
//  the modules/loadwords.js file for more info.
//
    const   word_list = words.loadWords(config);


///////////////////////////////////////////////////////////
//  Requests.
//
//  There is only one route which is /api/ followed by
//  the query string.
    app.get("/api/:query", function(request, response) {
        var query = request.params.query;
        
        if (typeof(query) === "undefined" || query == "") {
            response.send("!");
            response.end();
        }
        else {
            response.send(`${word_list.getMatch(query)}`);
            response.end();
        }
    });

    
    app.listen(config.APP_PORT, function() {
        console.log(`Listening on port ${config.APP_PORT}`);
    });

