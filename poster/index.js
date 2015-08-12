require("console-stamp")(console, "yyyy-mm-dd HH:MM:ss.l");

var Poster = require('./class.poster.js'),
    config = require('./config.js'),
    poster = new Poster(config);
