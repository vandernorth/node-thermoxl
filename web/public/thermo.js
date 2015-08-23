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
    var graph = $('#flot-history');
    if ( graph.length > 0 ) {
        console.log('History channel');

        $('#interval').change(function () {
            doStuff();
        });

        doStuff();
        function doStuff() {

            var interval = $("input[type='radio']:checked").val(),
                barWidth = 60 * 60 * 1000;

            switch ( interval ) {
                case'year':
                    barWidth = 365 * 24 * 60 * 60 * 1000;
                    break;
                case'month':
                    barWidth = 30 * 24 * 60 * 60 * 1000;
                    break;
                case'week':
                    barWidth = 7 * 24 * 60 * 60 * 1000;
                    break;
                case'day':
                    barWidth = 24 * 60 * 60 * 1000;
                    break;
                case'hour':
                    barWidth = 60 * 60 * 1000;
                    break;
                case'hourofday':
                    barWidth = 60 * 60 * 1000;
                    break;
                case'dayofweek':
                    barWidth = 24 * 60 * 60 * 1000;
                    break;
            }

            $.ajax('/data/history?interval=' + interval).done(function ( data ) {
                var translatedDataPower = [];
                var translatedDataGas   = [];

                data.forEach(function ( dp ) {
                    var dt   = dp._id,
                        date = new Date(dt.year, dt.month || null, dt.day || null, dt.hour || null);
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
                    order:     1,
                    fillColor: "#AA4643"
                }
            }, {
                data:  dataG,
                label: "Gas usage",
                bars:  {
                    show:      true,
                    barWidth:  barWidth,
                    fill:      true,
                    lineWidth: 1,
                    order:     1,
                    fillColor: "#AA4643"
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
                    mode: 'time'
                }],
                yaxes:           [{
                    min: 0
                }, {
                    // align if we are to the right
                    alignTicksWithAxis: 1,
                    position:           "right"
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
                    content:     "%s for %x was %y kW",
                    xDateFormat: "%Y-%m-%d %h:%M"
                }

            });
        }

    }

});
