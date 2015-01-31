var ReadingBase 	= require('./reader.p1.schema.js'),
	Reading			= {},
	util 			= require('util'),
	_ 				= require("underscore"),
	mongoose 		= require('mongoose'),
	EventEmitter 	= require('events').EventEmitter;

var ReaderP1 = function(settings) {
	
	var self = this;
	
	if( typeof settings !== 'object') { settings = {}; }
	this.INTERVAL 	= settings.interval || 10000;
	this.DB			= settings.db || 'mongodb://192.168.0.23/smartreadings';
	
	this.isConnected= false;
	this.db			= mongoose.createConnection(this.DB);
	
	this.db.once('open', function (callback) {
			self.isConnected = true;
			Reading = self.db.model('Reading', ReadingBase.readingSchema);
	});
	
	this.db.on('error', function(e){
		console.log('[P1Mongodb error]', e);
	})

	//== Start fetching
	this.interval 	= setInterval(function() { self.readLast(); }, this.INTERVAL);
	
}

//== Make event emittable
util.inherits(ReaderP1, EventEmitter);

//== Prototype
_.extend(ReaderP1.prototype, {

	readLast : function() {
		
		if(this.isConnected === true) {			
			var self = this;
			Reading.findOne({}, {}, { sort: { 'date' : -1 } }, function(err, post) {
				if(err) { self.emit('error', err)}
				else {
					self.emit('change', post);
				}
			});
		} else {
			console.log('not (yet) connected, cannot read!');
		}
	}
});

//== Export
module.exports = ReaderP1;
