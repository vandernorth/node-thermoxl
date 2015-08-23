var moment    = require('moment'),
    _         = require('lodash'),
    Dashboard = function Dashboard( req ) {
        this.req = req;
    };

Dashboard.prototype.getDashboardData = function () {
    return new Promise(function ( resolve, reject ) {

        var Reading = require("./reader.p1.schema.js").Reading;
        Reading.findOne({}, {}, { sort: { 'date': -1 } }, function ( err, p1 ) {
            if ( err || p1 === null ) { reject('Error: ' + (err || 'not found'))}
            else {
                var dashboardData               = {};
                dashboardData.p1                = {};
                dashboardData.p1.gasTimeFormat  = moment(p1.gasTime, 'YYMMDDhhmmss').fromNow();
                dashboardData.p1.gasUse         = p1.gasUse;
                dashboardData.p1.currentUseWatt = Math.ceil(p1.currentUse * 1000) + ' ';
                dashboardData.p1.lastUpdate     = moment(p1.date).fromNow();
                dashboardData.p1.totalHigh      = p1.totalHigh;
                dashboardData.p1.totalLow       = p1.totalLow;

                var checkDate = new Date(moment(p1.date).startOf('day').add(-2, 'days').toDate().valueOf());

                Reading//.find()
                    .aggregate([
                        { $match: { "date": { $gt: checkDate } } },
                        { $sort: { 'date': -1 } },
                        {
                            $group: {
                                _id:    { $dayOfYear: '$date' },//{
                                //year:  { $year: '$date' },
                                //month: { $month: '$date' },
                                //day:   { $dayOfYear: '$date' }
                                //},
                                HMin:   { $min: '$totalHigh' },
                                HMax:   { $max: '$totalHigh' },
                                LMin:   { $min: '$totalLow' },
                                LMax:   { $max: '$totalLow' },
                                GMin:   { $min: '$gasUse' },
                                GMax:   { $max: '$gasUse' },
                                //data : { $push : '$productDatum'},
                                aantal: { $sum: 1 }
                            }
                        }
                    ], function ( err2, agg ) {
                        if ( err2 || !agg || agg.length < 1 ) {
                            dashboardData.historyError = err2;
                            dashboardData.history      = [];
                            dashboardData.stats        = {};
                            resolve(dashboardData);
                        } else {

                            var days  = _.pluck(agg, '_id'),
                                today = _.max(days);

                            days.splice(days.indexOf(today));

                            var yesterday = _.max(days);

                            today     = _.find(agg, {
                                '_id': today
                            });
                            yesterday = _.find(agg, {
                                '_id': yesterday
                            });

                            //dashboardData.history = agg;
                            dashboardData.stats = {};

                            //dashboardData.today     = today;
                            //dashboardData.yesterday = yesterday;

                            if ( yesterday && today ) {
                                var fix                            = 2;
                                dashboardData.stats.totalToday     = ((today.HMax + today.LMax) - (today.HMin + today.LMin)).toFixed(fix);
                                dashboardData.stats.totalYesterday = ((yesterday.HMax + yesterday.LMax) - (yesterday.HMin + yesterday.LMin)).toFixed(fix);
                                dashboardData.stats.totalDiff      = (dashboardData.stats.totalToday - dashboardData.stats.totalYesterday).toFixed(fix);

                                dashboardData.stats.gasToday     = ((today.GMax) - (today.GMin)).toFixed(fix);
                                dashboardData.stats.gasYesterday = ((yesterday.GMax) - (yesterday.GMin)).toFixed(fix);
                                dashboardData.stats.gasDiff      = (dashboardData.stats.gasToday - dashboardData.stats.gasYesterday).toFixed(fix);
                            }

                            resolve(dashboardData);
                        }
                    });

            }
        });
    });
};

Dashboard.prototype.usage = function ( res ) {

    console.log('preparing usage stats');

    var Reading = require("./reader.p1.schema.js").Reading;

    Reading.findOne({}, {}, { sort: { 'date': -1 } }, function ( err, p1 ) {
        if ( err || p1 === null ) { res.json([]);}
        else {

            var lastHours = moment(p1.date).add(-0.5, 'hours');

            Reading
                .find({ 'date': { '$gte': lastHours.toDate() } })
                .select('date currentUse totalLow totalHigh')
                .sort({ date: 1 })
                .exec(function ( err, readings ) {
                    if ( err ) {
                        res.json({ error: err });
                    } else {
                        var result = readings.map(function ( item ) {

                            return [(new Date(item.date)).valueOf(), item.currentUse * 1000];

                        });
                        res.json(result);
                    }
                });
        }
    });

};

Dashboard.prototype.render = function ( res ) {

    this.getDashboardData()
        .then(function ( dashboardData ) {
            res.render('dashboard', dashboardData);
        })
        .catch(function ( dashboardError ) {
            res.end(dashboardError);
        });

};

function objectIdWithTimestamp( timestamp ) {
    // Convert string date to Date object (otherwise assume timestamp is a date)
    if ( typeof(timestamp) == 'string' ) {
        timestamp = new Date(timestamp);
    }

    // Convert date object to hex seconds since Unix epoch
    var hexSeconds = Math.floor(timestamp / 1000).toString(16);

    // Create an ObjectId with that hex timestamp
    return constructedObjectId = require('mongoose').Types.ObjectId(hexSeconds + "0000000000000000");

    //return constructedObjectId
}

Dashboard.prototype.getHistory = function ( res ) {

    // start, end, interval[hour,day,week,month,quarter,year, dayofweek, hourofday]
    var Reading     = require("./reader.p1.schema.js").Reading,
        aggregateID = {},
        interval    = this.req.query.interval,
        startDate   = this.req.query.start;

    if ( startDate ) {
        //startDate = new Date(startDate);//moment(startDate, 'YYYY-MM-DD').toDate();
        //console.log('start = ', startDate);
        startDate = { id: { '$gt': objectIdWithTimestamp(startDate) } };
    } else {
        startDate = {};
    }
    switch ( interval ) {
        case'year':
            aggregateID = { year: { $year: "$date" } };
            break;
        case'month':
            aggregateID = {
                year:  { $year: "$date" },
                month: { $month: "$date" }
            };
            break;
        case'week':
            aggregateID = {
                year: { $year: "$date" },
                week: { $week: '$date' }
            };
            break;
        case'day':
            aggregateID = {
                year:  { $year: "$date" },
                month: { $month: "$date" },
                day:   { $dayOfMonth: "$date" }
            };
            break;
        case'hour':
            aggregateID = {
                year:  { $year: "$date" },
                month: { $month: "$date" },
                day:   { $dayOfMonth: "$date" },
                hour:  { $hour: '$date' }
            };
            break;
        case 'hod' ://'hourofday':
            aggregateID = {
                hour: { $hour: '$date' }
            };
            break;
        case 'dow'://'dayofweek':
            aggregateID = {
                day: { $dayOfWeek: '$date' }
            };
            break;
        default:
            res.json({ error: 'invalid interval ' + interval });
            return true;
            break;
    }

    Reading
        .aggregate(
        {
            $group: {
                id:           { $min: '$_id' },
                _id:          aggregateID,
                count:        { $sum: 1 },
                totalLowMin:  { $min: '$totalLow' },
                totalLowMax:  { $max: '$totalLow' },
                totalHighMin: { $min: '$totalHigh' },
                totalHighMax: { $max: '$totalHigh' },
                totalGasMin:  { $min: '$gasUse' },
                totalGasMax:  { $max: '$gasUse' }
            }
        })
        .match(startDate)
        .project({
            powerUsage: {
                $subtract: [
                    { $add: ['$totalLowMax', '$totalHighMax'] },
                    { $add: ['$totalLowMin', '$totalHighMin'] }
                ]
            },
            gasUsage:   {
                $subtract: ['$totalGasMax', '$totalGasMin']
            }
        })
        .sort({ _id: 1 })
        .exec(function ( err, readings ) {
            if ( err ) {
                res.json({ error: err });
            } else {
                var result = readings.map(function ( item ) {

                    item.powerUsage = item.powerUsage.toFixed(5);
                    item.gasUsage   = item.gasUsage.toFixed(5);

                    //item.date = moment(item.date).utcOffset(-moment(item.date).utcOffset());

                    return item;

                });
                res.json(result);
            }
        });

};
module.exports                 = Dashboard;