var express 	= require("express"),
    dot 	= require("express-dot"),
    app 	= express(),
    reader	= require("./reader.temperature.js");

var data = {};
//== Routes
app.get("/", function(req, res) {

	//res.end("Hello!");
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

reader(function(sensor){ console.log("sensor", sensor); data.temperature = sensor.temperature; data.humidity = sensor.humidity;});
