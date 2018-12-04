/**********************************************************
 * front/app/api.js
 */


///////////////////////////////////////////////////////////
//  For testing purposes.
//
//  Setting API_DEBUG to flase will cause the _debugMsg()
//  to suppress output, if true then _debugMsg() will
//  dump information to the console.
//
const   API_DEBUG = true;


///////////////////////////////////////////////////////////
//  Pretty clear what these do, change as required.
//
const   API_SERVER_ADDR = "localhost";
const   API_SERVER_PORT = 3000;


///////////////////////////////////////////////////////////
//  This is used to index the words alphabetically.
//
//  Any word in the list that doesn't begin with one of
//  these characters is discarded (uppercase is converted
//  to lowercase).
//
const   ALPHACHARS = "abcdefghijklmnopqrstuvwxyz0123456789";


///////////////////////////////////////////////////////////
//  Returns the ALPHACHARS index of the words initial
//  character.
//
//  Uppercase is converted to lowecase.
const _getAlphaIndex = word => {
    return ALPHACHARS.indexOf(word.substr(0, 1).toLowerCase());
};


////////////////////////////////////////////////////////////
//  SeatchAPI
//
//  For the font-end I decided to build a simple module
//  that manages the input and output.
//
//  the closure only reveals a single public method, the
//  init method. Calling thsi method directly will refresh
//  the input and output buffers and prepare the object
//  for operation.
//
const SearchAPI = (function(server, port) {

    // Defaults if server and port are under.
    let _server = "localhost"
    let _port = 3000;

    let _out;       // Data sent to the API
    let _in;        // Data received from the API

    let _pos;       // Current cursor position


    if (typeof(server) === "string") _server = server;
    if (typeof(port) === "number") _port = port;


///////////////////////////////////////////////////////////
//  ID of the search nput element.
//
//  This can be set by passing the elID parameter to the
//  _init() method, if unspecified it defaults to "search"
//
    let _elID;
    let _el;


    let _debugMsg = function(debug_msg) {
        if (typeof(debug_msg) === "string") {
            if (API_DEBUG)
                console.log(`${debug_msg}`);
        }
    };


///////////////////////////////////////////////////////////
//  _isArrowKey(key)
//
//  Very simple boolean helper function, will return
//  true if the given key is an ArrowUp, ArrowDown,
//  ArrowLeft or ArrowRight.
//
    let _isArrowKey = function(key) {
        if (
            key === "ArrowUp" ||
            key === "ArrowDown" ||
            key === "ArrowLeft" ||
            key === "ArrowRight"
        ) return true

        return false;
    };


///////////////////////////////////////////////////////////
//  _handleBackspace()
//
//  Assuming _pos > 0, will remove the character to the
//  left of _pos in the _out buffer, Example, if we have
//  a string like "abc" and the _pos is set to 1, this
//  means the cursor is between the a and b.
//
//  If we press backspace at position 1, the character to
//  the left of the current _pos (the 'a' character) will
//  be removed and the _pos value will decrease to 0.
//
    const _handleBackspace = function() {
        var left = _out.slice(0, (_pos - 1));
        var right = _out.slice(_pos);

        _out = left + right;
        _pos--;

        if (! _out.length) {
            _el.innerHTML = "";
            _in = "";
            _pos = 0;
        }
    };


///////////////////////////////////////////////////////////
//  _queryAPI()
//
//  This method is triggered any time the _out buffer
//  changes.
//
//  It submits an xml HTTP request to the specified
//  _server:_port - the _success and _failure parameters
//  are callbacks that are called on success/failure of
//  the AJAX request, respectively.
//
//  On success the data returned from the server is
//  passed to the _success() function.
//
//  If an query returns no results then _in (this is
//  where the response/incoming data from the server
//  is stored) will be an empty string, _failure is
//  called when connecting to the server fails and
//  therefore throws an error.
//
    const _queryAPI = function(_success, _failure) {
        var api_call = `http://${_server}:${_port}/api/${_out}`;

        var api_http = new XMLHttpRequest();
        
        api_http.onreadystatechange = function() {
            if (this.readyState == 4) {
                if (this.status == 200) {
                    if (typeof(_success) === "function")
                        _debugMsg(`Send ${_out}, received ${this.responseText}`)
                        _success(this.responseText);
                }
                else {
                    if (typeof(_failure) === "function")
                        _failure(this.responseText);
                }
            }
        };

        api_http.open("GET", api_call, true);
        api_http.send();
    };


    const _setCursorPosition = function() {
        if (_el.innerHTML == "" || _pos < 0) return;

        var range = document.createRange();
        var selection = window.getSelection();

        try {
            range.setStart(_el.childNodes[0], _pos);
            range.collapse(true);
        } 
        catch {
            return;
        }
        selection.removeAllRanges();
        selection.addRange(range);
    };


    const _lockInput = function() {
        if (_in.length > 0) {
            _out = _in;
            _in = "";
        }

        _pos = _out.length;
        _el.innerHTML = _out;

        _setCursorPosition();
    };


///////////////////////////////////////////////////////////
//  _handleKeyInput()
//
//  This is bound to the keypress event of the input
//  element (_el).
//
//  See the local _init() method (below)
//
    const _handleKeyInput = function(event) {
        event.preventDefault();

        var key = event.key || event.keyCode;

        if (key === "Backspace") {
        //  Handle the backspace key - calls on
        //  local method _handleBackspace()
            if (_out.length && _pos)
                _handleBackspace();
        }
        else if (_isArrowKey(key)) {
            if (key === "ArrowLeft" && _pos > 0)
                _pos--;
            if (key === "ArrowRight" && _pos < _out.length)
                _pos++;
        }
        else if (key === "Tab") {
        //  Handle tab - the _in buffer is simply
        //  copied to the _out buffer (assuming
        //  _in isn't empty).
            return _lockInput();
        }
        else {
            if (key.length == 1 && _getAlphaIndex(key) > -1) {
        //  Add character to the _out buffer and advance
        //  the cursor position.
            _out += key;
            _pos++;
            }
        }

    //  Submit the AJAX request - we don't want to do
    //  this on an arrow key press, only on backspace
    //  or a valid input character.
        if (! _isArrowKey(key)) {
            _queryAPI(function(response) {
                if (typeof(response) === "undefined" || response != "") {
                    _in = response;
                    _el.innerHTML = _out;

                    _el.innerHTML += `<span class="unlocked">${response.substr(_out.length)}</span>`;
                }
                else {
                    _in = "";
                    _el.innerHTML = _out;
                }

                _pos = _out.length;
                
                _setCursorPosition();
            });
        }

    //  Set the cursor position in the input text
    //  element.
    //    _el.setSelectionRange(_pos, _pos);
        _setCursorPosition();
    };


///////////////////////////////////////////////////////////
//  _init() method
//
//  Initialises the system, refreshing the _in/_out
//  buffers, _pos, etc.
//
    const _init = function(elID) {
    //  Reset buffers and current _out character
    //  position.
        _in = _out = "";
        _pos = 0;

    //  Default to input element id="search"
        if (typeof(elID) !== "string") _elID = "search";
        else _elID = elID;

        _el = document.getElementById(_elID);
        _el.value = "";

    //  Enable the keydown event handler, calls
    //  local method _hanleKeyInput()
        _el.addEventListener("keydown", function(event) {
            _handleKeyInput(event);
        });

        document.getElementById('search-clear').addEventListener("click", function() {
            _out = _in = _el.innerHTML = "";
            _pos = 0;
        });

        document.getElementById('search-lock').addEventListener("click", function() {
            _lockInput();
        });
    };


///////////////////////////////////////////////////////////
//  Public interface.
//
    return {
        "init":             _init
    };

})(API_SERVER_ADDR, API_SERVER_PORT);


const   init = SearchAPI.init;

