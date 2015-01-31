/**
  * @TODO:
  * Python script, accept GPIO pin number
  * 
*/

//== Requirements
var EventEmitter 		= require('events').EventEmitter,
	util 				= require('util'),
	_ 					= require("underscore"),
	fs 					= require("fs"),
	HttpServer			= require("./http.server.js"),
	Controller			= require("./controller.gpio.js"),
	ReaderTemperature	= require("./reader.temperature.js"),
	ReaderP1			= require("./reader.p1.js");

//== Main Thermo Class
var Thermo = function(settings){
	
	//== Settings
	if( typeof settings !== 'object') { settings = {} }
	this.sensor		= settings.sensor || {};
	this.currentTemperature = 15.0;
	this.data		= {};
	
	this.attachReaders();
	this.controller = new Controller(this);
	this.restoreTemperature();
	
	this.http = new HttpServer(this);
	
}

//== Make event emittable
util.inherits(Thermo, EventEmitter);

//== Prototype
_.extend(Thermo.prototype, {
	
	attachReaders : function(){
		
		var self = this;
		
		//== Temperature
		this.reader = new ReaderTemperature( this.sensor );
		this.reader.on('change.temperature', function(temperature){
			console.log('change.temperature',temperature);
			self.data.temperature = temperature;
			self.emitChange();
		});

		this.reader.on('change.humidity', function(humidity){
			console.log('change.humidity',humidity);
			self.data.humidity = humidity;
			self.emitChange();
		});

		this.reader.on('error', function(a, b){
			console.log('error :-( ',a,b);
		});
		
		//== Usage via P1
		this.readerP1 = new ReaderP1();
		
		this.readerP1.on('change', function(data){ self.data.p1 = _.omit(data, ['original','_v', '_id']); self.emitChange(); });
		this.readerP1.on('error', function(data){ console.log('P1 error',data);});
	},
	
	emitChange : function() {
		this.emit('change', this.getData());
	},
	
	getData : function() {
		this.data.currentTemperature = this.currentTemperature;
		return this.data;
	},
	
	restoreTemperature : function(){
		
		if(fs.existsSync('./temperature.bak')){
			console.log('Found backup file... restoring...');
			var storedTemperature = parseFloat(fs.readFileSync('./temperature.bak').toString());
			this.setTemperature(storedTemperature);
			
		} else { console.log('No backup temperature found.'); }
	},
	
	setTemperature : function(newTemperature) {
		
		console.log('Settings Desired Temprature to', newTemperature);
		this.currentTemperature = newTemperature.toFixed(1);
		fs.writeFileSync('./temperature.bak', newTemperature);
		this.emit('set.temperature', newTemperature);
	},
	
});

//== Start
var myThermo = new Thermo();
