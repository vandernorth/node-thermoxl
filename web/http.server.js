//== Requirements
var express 	= require("express"),
    dot 		= require("express-dot"),
    app 		= express(),
	_ 			= require("underscore");
	
	
function HttpServer(thermo) {
	
	var data = {};
	//== Routes
	app.get("/", function(req, res) {

		//res.end("Hello!");
		//== Calculations
		var now = new Date();
		
		if(data.p1) {
			
			data.sensorDiff = now - data.p1.date; //== ms
			data.sensorDiff = data.sensorDiff/1000/60; //== min
			if(data.sensorDiff < 1) {data.sensorDiff = undefined}
			else { data.sensorDiff = data.sensorDiff.toFixed(1);}
		}
		
		data.time = (new Date()).toTimeString().substring(0,5);
		console.dir(data);
		res.render("index", data);
	});

	//== Settings
	app.set("views", __dirname + "/http");
	app.set("view engine", "dot");
	app.engine("dot", dot.__express);

	//== Http Server
	console.log('Starting webserver on port 80');
	app.listen(80, function() {
		console.log("server is running!");
	});
	
	thermo.on('change', function(newData){
		
		data = newData;
		
		if(data.p1){
			data.p1.currentUse = (data.p1.currentUse*1000).toFixed(0);
		}
		
	});
	
}

//== Export
module.exports = HttpServer;