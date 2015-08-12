require("console-stamp")(console, "yyyy-mm-dd HH:MM:ss.l");

var HttpServer = require('./class.httpserver.js'),
    config = require('./config.js'),
    httpServer = new HttpServer(config);

module.exports = httpServer;