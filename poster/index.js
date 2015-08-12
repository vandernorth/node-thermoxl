require("console-stamp")(console, "HH:MM:ss.l");

var Poster = require('./class.poster.js'),
    config = require('./config.js'),
    poster = new Poster(config);
