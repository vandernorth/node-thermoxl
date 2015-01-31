//== Requirements
var python 			= require("python-shell"),
	EventEmitter 	= require('events').EventEmitter,
	util 			= require('util'),
	_ 				= require("underscore");

//== Temp/Humid Reader class
var ReaderTemperature = function( settings ){
	
	//== Settings
	if( typeof settings !== 'object') { settings = {} }
	this.READ_INTERVAL 		= settings.readInterval 	|| 12000; 	//== Default 12s read interval
	this.AVERAGE_LENGTH		= settings.averageLength 	|| 5;		//== Average over 5 readings
	this.GPIO_PIN			= settings.gpioPin			|| 17;		//== Sensor connected to gpio #17
	
	//== Local Storage
	this.readings			= [];
	this.lastTemperature	= 0.0;
	this.lastHumidity		= 0.0;
	
	//== Start
	this.setInterval();
	
	//== Do first reading
	this.performReading();
	
}

//== Make event emittable
util.inherits(ReaderTemperature, EventEmitter);

//== Prototype
_.extend(ReaderTemperature.prototype, {
	
	//== Start reading on interval
	setInterval : function() {
		var self = this;
		this.interval = setInterval(function() { self.performReading(); }, this.READ_INTERVAL);
	},
	
	//== performReading
	performReading : function() {
		
		var self = this;
		
		//== Run python script to read from sensor
		python.run("readsensor.py", {args : [this.GPIO_PIN]}, function(scriptError, result){
			
			try {
				
				//== Check for errors
				if(scriptError) { throw scriptError}
				
				//== Read output from script to JSON
				var json = JSON.parse(result);
				
				if(!json || json.error || !json.temperature || !json.humidity) { throw new Error('Could not read from sensor. ' + (json || {}).error);}
				else {
					//== Reading was OK.
					self.addReading(json);
				}
				
			} catch (sensorException) {
				
				//== Emit error
				console.error('[SensorError]', sensorException);
				self.emit('error', sensorException);
				
			}
		});
	},
	
	//== Add Reading
	addReading : function(rawData) {
		this.readings.push({
			temperature : parseFloat(rawData.temperature),
			humidity	: parseFloat(rawData.humidity),
		});
		
		this.readings.slice(0,this.AVERAGE_LENGTH);
		this.calculate();
	},
	
	//== Calculate and compare
	calculate : function() {
		
		var average_temperature = (_.reduce(this.readings, function(last, add){ return last + parseFloat(add.temperature);}, 0)		/ this.readings.length).toFixed(1);
		var average_humidity 	= (_.reduce(this.readings, function(last, add){ return last + parseFloat(add.humidity);}, 0)		/ this.readings.length).toFixed(1);
		
		//== Check if changed temperature
		if(average_temperature !== this.lastTemperature) {
			this.lastTemperature = average_temperature;
			this.emit('change.temperature', average_temperature);
		}
		
		//== Check if changed humidity
		if(average_humidity !== this.lastHumidity) {
			this.lastHumidity = average_humidity;
			this.emit('change.humidity', average_humidity);
		}
		
	}
});

//== Export
module.exports = ReaderTemperature;
