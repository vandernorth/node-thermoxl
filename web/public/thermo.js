function numericString( number ) {
    number = number || '';
    return (number > 0) ? '+' + number : number.toString();
}

//Flot Multiple Axes Line Chart
$(function () {

    var graph = $('#flot-line-chart');
    if ( graph.length > 0 ) {

        //== Update main dashboard data
        $(function () {
            setInterval(function () {

                console.log('Trying to get new data');

                $.ajax('/data/dashboard').done(function ( data ) {
                    console.log('New data', data);
                    $('.totalToday').text(data.stats.totalToday);
                    $('.totalDiff').text(numericString(data.stats.totalDiff));
                    $('.gasToday').text(data.stats.gasToday);
                    $('.gasDiff').text(numericString(data.stats.gasDiff));

                    $('.currentUse').text(data.p1.currentUseWatt);
                    $('.totalLow').text(data.p1.totalLow);
                    $('.totalHigh').text(data.p1.totalHigh);
                    $('.gasTimeFormat').text(data.p1.gasTimeFormat);
                    $('.gasUse').text(data.p1.gasUse);
                    $('.lastUpdate').text(data.p1.lastUpdate);

                });

            }, 3000);
        });

        function doPlot( position, data ) {
            //$.plot($("#flot-line-chart-multi"), [{
            $.plot($("#flot-line-chart"), [{
                data:  data,
                label: "Power usage",
                yaxis: 2
            }], {
                series:          {
                    lines:  {
                        fill: true,
                        show: true
                    },
                    points: {
                        //show: true
                    }
                },
                backgroundColor: {
                    colors: ["#fff", "#e4f4f4"]
                },
                margin:          {
                    top:    8,
                    bottom: 20,
                    left:   20
                },
                xaxes:           [{
                    mode: 'time'
                }],
                yaxes:           [{
                    min: 0
                }, {
                    // align if we are to the right
                    alignTicksWithAxis: position == "right" ? 1 : null,
                    position:           position
                }],
                legend:          {
                    position: 'sw'
                },
                grid:            {
                    hoverable:       true, //IMPORTANT! this is needed for tooltip to work
                    borderWidth:     1,
                    minBorderMargin: 20,
                    labelMargin:     10,
                    markings:        function ( axes ) {
                        var markings = [];
                        var xaxis    = axes.xaxis;
                        for ( var x = Math.floor(xaxis.min); x < xaxis.max; x += xaxis.tickSize * 2 ) {
                            markings.push({
                                xaxis: {
                                    from: x,
                                    to:   x + xaxis.tickSize
                                },
                                color: "rgba(232, 232, 255, 0.2)"
                            });
                        }
                        return markings;
                    }
                },
                tooltip:         true,
                tooltipOpts:     {
                    content:     "%s for %x was %y watts",
                    xDateFormat: "%h:%M",

                    onHover: function ( flotItem, $tooltipEl ) {
                        // console.log(flotItem, $tooltipEl);
                    }
                }

            });
        }

        function reloadUsage() {
            $.ajax('/data/usage').done(function ( data ) {
                doPlot("right", data);
            });
        }

        reloadUsage();

        setInterval(function updateRandom() {
            //series[0].data = getRandomData();
            //plot.setData(series);
            //plot.draw();
            reloadUsage();
        }, 9000);
    }
});

//Flot Moving Line Chart

$(function () {
    var graph = $('#flot-history'), dateFormat = '%Y-%m-%d @%h:%M', momentFormat = 'LLL', startDate;
    if ( graph.length > 0 ) {
        console.log('History channel');

        $('#interval').change(function () {
            doStuff();
        });

        /*$('#setDate').click(function(event){
            startDate = $('#start').val();
            console.log('val',startDate);

            event.stopPropagation();
            return false;
        });*/

        doStuff();
        function doStuff() {

            var interval = $("input[type='radio']:checked").val(),
                barWidth = 60 * 60 * 1000;

            startDate = $('#start').val();

            switch ( interval ) {
                case'year':
                    barWidth     = 365 * 24 * 60 * 60 * 1000;
                    dateFormat   = 'Year %Y';
                    momentFormat = 'YYYY';
                    break;
                case'month':
                    barWidth     = 31 * 24 * 60 * 60 * 1000;
                    dateFormat   = '%Y-%b';
                    momentFormat = 'LL';
                    break;
                case'week':
                    barWidth     = 7 * 24 * 60 * 60 * 1000;
                    dateFormat   = '%Y-%b-%d';
                    momentFormat = 'YYYY - W';
                    break;
                case'day':
                    barWidth   = 24 * 60 * 60 * 1000;
                    dateFormat = '%Y-%b-%d';
                    break;
                case'hour':
                    barWidth     = 60 * 60 * 1000;
                    dateFormat   = '%Y-%b-%d @%hh';
                    momentFormat = 'LLL';
                    break;
                case'hod':
                    barWidth     = 60 * 60 * 1000;
                    dateFormat   = '@%h';
                    momentFormat = 'H';
                    break;
                case'dow':
                    barWidth     = 24 * 60 * 60 * 1000;
                    dateFormat   = '%a';
                    momentFormat = 'dddd';
                    break;
            }

            $.ajax('/data/history?interval=' + interval + '&start=' + startDate).done(function ( data ) {
                var translatedDataPower = [];
                var translatedDataGas   = [];

                data.forEach(function ( dp ) {
                    var dt   = dp._id,
                        date = new Date(Date.UTC(dt.year, (dt.month ? dt.month - 1 : null), dt.day || 1, dt.hour || null));

                    if ( interval === 'week' ) {
                        date = moment(dt.year + '-' + dt.week, 'gggg-ww').toDate();
                    }
                    else if ( interval === 'hod' ) {
                        date = new Date(Date.UTC(2015, 1, 1, dt.hour));
                    }
                    else if ( interval === 'dow' ) {
                        date = new Date(Date.UTC(2015, 8, 2 + dt.day));
                    }

                    console.log('created date', date, dt.month, dt.day);
                    translatedDataPower.push([date, dp.powerUsage]);
                    translatedDataGas.push([date, dp.gasUsage]);
                });

                console.log(translatedDataPower);
                doPlot(translatedDataPower, translatedDataGas, barWidth);
            });
        }

        function doPlot( dataP, dataG, barWidth ) {
            //$.plot($("#flot-line-chart-multi"), [{
            $.plot(graph, [{
                data:  dataP,
                label: "Power usage",
                bars:  {
                    show:      true,
                    barWidth:  barWidth,
                    fill:      true,
                    lineWidth: 1,
                    order:     1
                    //fillColor: "#AA4643"
                }
            }, {
                data:  dataG,
                label: "Gas usage",
                bars:  {
                    show:      true,
                    barWidth:  barWidth,
                    fill:      true,
                    lineWidth: 1,
                    order:     2
                    //fillColor: "#AA4643"
                }
            }], {
                series:          {
                    /*lines:  {
                     fill: true,
                     show: true
                     },*/
                    points: {
                        //show: true
                    }
                },
                backgroundColor: {
                    colors: ["#fff", "#e4f4f4"]
                },
                margin:          {
                    top:    8,
                    bottom: 20,
                    left:   20
                },
                xaxes:           [{
                    mode:          'time',
                    //tickSize:      barWidth / 1000,
                    tickFormatter: function ( number ) {
                        return moment(number).format(momentFormat);
                    }
                }],
                yaxes:           {
                    min:                0,
                    tickDecimals:       2,
                    alignTicksWithAxis: 0.25
                },
                legend:          {
                    position: 'sw'
                },
                grid:            {
                    hoverable:       true, //IMPORTANT! this is needed for tooltip to work
                    borderWidth:     1,
                    minBorderMargin: 20,
                    labelMargin:     10,
                    markings:        function ( axes ) {
                        var markings = [];
                        var xaxis    = axes.xaxis;
                        for ( var x = Math.floor(xaxis.min); x < xaxis.max; x += xaxis.tickSize * 2 ) {
                            markings.push({
                                xaxis: {
                                    from: x,
                                    to:   x + xaxis.tickSize
                                },
                                color: "rgba(232, 232, 255, 0.2)"
                            });
                        }
                        return markings;
                    }
                },
                tooltip:         true,
                tooltipOpts:     {
                    content:     "%s for %x was %y kW / m3",
                    xDateFormat: "[" + dateFormat + "]"
                }

            });
        }

    }

});
