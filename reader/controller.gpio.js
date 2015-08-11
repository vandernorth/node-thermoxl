//== Requirements
var EventEmitter 	= require('events').EventEmitter,
	util 			= require('util'),
	wpi 			= require('wiring-pi'),
	_ 				= require("underscore");

//== GPIO / Thermostat Controller class
var Controller = function( global ){
	
	var self = this;
	this.PIN = 29;
	this.global = global;

	wpi.setup('wpi');
	wpi.pinMode(this.PIN, wpi.OUTPUT);	
	this.initRelay();
	
	this.global.reader.on('change.temperature', function(t) {
		self.current = t;
		self.evaluate();
	});
	
	this.global.on('set.temperature', function(t) {
		self.set = t;
		self.evaluate();
	});
	
};

//== Make event emittable
util.inherits(Controller, EventEmitter);

//== Prototype
_.extend(Controller.prototype, {
	
	//== 
	evaluate : function() {
		
		if(this.current && this.set) {
			
			console.log('eval()', this.current, this.set);
			
			if(this.current < this.set){
				console.log('RELAY ON');
				this.setState(true);
			} else {
				console.log('RELAY OFF');
				this.setState(false);
			}
			
		} else {
			console.warn('Not enough data to evaluate.');
		}
	},
	
	initRelay : function() {
		
		//== Turn Off.
		wpi.digitalWrite(this.PIN, 1);
		
		this.state = 0;
		
	},
	
	setState : function(on){
		
		console.log('setState()', on, this.state);
		
		if(on && this.state === 0) {
			console.log('changing state ON');
			wpi.digitalWrite(this.PIN, 0);
			this.state === 1;
		} else if (!on && this.state === 1) {
			console.log('changing state OFF');
			wpi.digitalWrite(this.PIN, 1);
			this.state === 0;
		} else {
			console.log('Setted state is the same as current state', on, this.state);
		}
		
	}
});

//== Export
module.exports = Controller;
