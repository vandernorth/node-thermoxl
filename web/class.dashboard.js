var moment    = require('moment'),
    Dashboard = function Dashboard( req, res ) {

        var Reading = require("./reader.p1.schema.js").Reading;

        if ( self.isConnected === true ) {

        } else {
            res.end('not (yet) connected, cannot read!');
        }

    };

Dashboard.prototype.getDashboardData = function () {
    return new Promise(function ( resolve, reject ) {

        var Reading = require("./reader.p1.schema.js").Reading;
        Reading.findOne({}, {}, { sort: { 'date': -1 } }, function ( err, p1 ) {
            if ( err || p1 === null ) { reject('Error: ' + (err || 'not found'))}
            else {
                var dashboardData        = {};
                dashboardData.p1         = p1;
                dashboardData.p1.gasTime = moment(p1.gasTime,'YYMMDDhhmmss').format('LLL');
                dashboardData.p1.currentUse = Math.ceil(p1.currentUse * 1000) + ' watt';
                dashboardData.p1.lastUpdate = moment(p1.date).fromNow();

                resolve(dashboardData);
            }
        });

    });

};

Dashboard.prototype.render = function ( res ) {

    this.getDashboardData()
        .then(function ( dashboardData ) {
            res.render('index', dashboardData);
        })
        .catch(function ( dashboardError ) {
            res.end(dashboardError);
        });

};

module.exports = Dashboard;