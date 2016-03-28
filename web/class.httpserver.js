//== Globals
var _              = require('lodash'),
    express        = require("express"),
    expressSession = require("express-session"),
    addRequestId   = require("express-request-id")(),
    connectMongo   = require("connect-mongo"),
    cookieParser   = require("cookie-parser"),
    dotEngine      = require("express-dot-engine"),
    bodyParser     = require("body-parser"),
    socketio       = require("socket.io"),
    mongoose       = require("mongoose"),
    moment         = require("moment"),
    nodemailer     = require("nodemailer");

/**
 *
 * @param config            {object}
 * @param config.port       {number}
 * @param config.database   {number}
 * @constructor
 */
var HttpServer = function HttpServer( config ) {

    this.config  = config;
    this.express = express();

    this.dbConnect();
    this.startServer();
    this.route();
    this.set404();

};

HttpServer.prototype.startServer = function () {

    //this.express.use(addRequestId);
    this.express.use(_.bind(this.addRequestLog, this));
    this.express.set('trust proxy', 'uniquelocal');
    this.express.use(bodyParser.urlencoded({ extended: true }));
    this.express.use(bodyParser.json());

    //== Dot View engine
    this.express.engine('dot', dotEngine.__express);
    this.express.set('views', __dirname + '/views');
    this.express.set('view engine', 'dot');
    this.dotEngine              = dotEngine;
    this.dotEngine.settings.dot = {
        evaluate:      /\{\{([\s\S]+?)}}/g,
        interpolate:   /\{\{=([\s\S]+?)}}/g,
        encode:        /\{\{!([\s\S]+?)}}/g,
        use:           /\{\{#([\s\S]+?)}}/g,
        define:        /\[\[##\s*([\w\.$]+)\s*(:|=)([\s\S]+?)#]]/g,
        conditional:   /\{\{\?(\?)?\s*([\s\S]*?)\s*}}/g,
        iterate:       /\{\{~\s*(?:}}|([\s\S]+?)\s*:\s*([\w$]+)\s*(?::\s*([\w$]+))?\s*}})/g,
        varname:       'layout, partial, locals, it',
        strip:         false,
        append:        true,
        selfcontained: false
    };

    this.express.set('x-powered-by', false);

    //== Static routes
    this.express.use('/public', express.static(__dirname + '/public'));
    this.express.use('/fonts', express.static(__dirname + '/public/fonts'));
    this.express.use('/bower_components', express.static(__dirname + '/theme/bower_components'));
    this.express.use('/dist', express.static(__dirname + '/theme/dist'));
    this.express.use('/js', express.static(__dirname + '/theme/js'));
    this.express.use('/less', express.static(__dirname + '/theme/less'));

    this.enableWebsockets();

    //== Errors
    this.express.use(function ( error, req, res, next ) {
        if ( !error ) {next();}
        self.displayError(req, res, 'Service temporarily unavailable', 'Unable to load the requested page.', {
            status: 503,
            error:  error,
            stack:  error.stack
        });
    });

    this.express.set('x-powered-by', false);

    //== Listen
    this.server.listen(this.config.port);

    console.info('Server ready on port', this.config.port);
};

HttpServer.prototype.route = function () {

    var self = this;

    this.express.get('/', function ( req, res ) {
        res.redirect('/dashboard');
    });

    this.express.get('/dashboard', function ( req, res ) {

        var Dashboard = require('./class.dashboard'),
            dashboard = new Dashboard(req);

        dashboard.render(res);

    });

    this.express.get('/history', function ( req, res ) {
        res.render('history');
    });

    this.express.get('/data/usage', function ( req, res ) {

        var Dashboard = require('./class.dashboard'),
            dashboard = new Dashboard(req);

        dashboard.usage(res);

    });

    this.express.get('/data/history', function ( req, res ) {

        var Dashboard = require('./class.dashboard'),
            dashboard = new Dashboard(req);

        dashboard.getHistory(res);

    });

    this.express.get('/data/dashboard', function ( req, res ) {

        var Dashboard = require('./class.dashboard'),
            dashboard = new Dashboard(req);

        dashboard.getDashboardData().then(function ( result ) {
            res.json(result);
        })
            .catch(function ( error ) {
                res.json({ error: error })
            });

    });

    this.express.post('/api/v1/post', function ( req, res ) {

        var Reading = require("./reader.p1.schema.js").Reading;
        console.log('Incoming!', req.header['x-forwarded-for']);
        console.log('Incoming!', req.body);

        if ( self.isConnected === true ) {
            var r = new Reading(req.body);
            r.save(function () {
                console.info('Reading saved');
            });
            res.end('-ok-');
        }
        else {
            console.error('Not connected');
            res.end('!nok!');
        }
    });

};

/** Connect to mongodb database based on settings in the config file. Retry every 10s when connection fails
 * @private
 */
HttpServer.prototype.dbConnect = function () {
    var self    = this,
        options = {};

    console.info('system', 'Trying db connection...');
    mongoose.connect(self.config.database, options, function ( connectError ) {

        if ( connectError ) {
            self.isConnected = false;
            console.error('system', '[db connect] ERROR connecting to mongodb. ' + connectError + ' Trying again in 10 seconds...');
            setTimeout(function () {
                self.dbConnect();
            }, 10000);
        }
        else {
            console.info('system', '[db connect] Connected to mongodb');
            self.isConnected = true;
        }
    });
};

HttpServer.prototype.addRequestLog = function ( req, res, next ) {
    console.log('[request]', req.method, req.url, req.id);
    next();
};

HttpServer.prototype.set404 = function () {
    this.express.use(function ( req, res ) {
        console.info('[404] Page not found: ' + req.url);
        if ( req.url.indexOf('/public') === 0 ) {
            res.status(404).end('/*404*/');
        } else {
            res.status(404).end('/*404*/');
        }
    });
};

HttpServer.prototype.displayError = function ( req, res, title, message, options ) {
    options = options || {};

    console.error(title, message);
    res.status(options.status || 500).end(title + '\n' + message);

    /*.render('client-error', {
     title:   title,
     message: message,
     url:     req.url
     });*/
};

HttpServer.prototype.enableWebsockets = function () {

    //== Enable web-sockets and sync with express session.
    this.server = require('http').Server(this.express);
    this.io     = socketio(this.server);
};

//== Export
module.exports = HttpServer;