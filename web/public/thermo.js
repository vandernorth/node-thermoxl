function numericString(number){
    number = number || '';
        return (number > 0) ? '+' + number : number.toString();
}
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

//Flot Pie Chart
$(function () {

    var data = [{
        label: "Series 0",
        data:  1
    }, {
        label: "Series 1",
        data:  3
    }, {
        label: "Series 2",
        data:  9
    }, {
        label: "Series 3",
        data:  20
    }];

    /*var plotObj = $.plot($("#flot-pie-chart"), data, {
     series:      {
     pie: {
     show: true
     }
     },
     grid:        {
     hoverable: true
     },
     tooltip:     true,
     tooltipOpts: {
     content:      "%p.0%, %s", // show percentages, rounding to 2 decimal places
     shifts:       {
     x: 20,
     y: 0
     },
     defaultTheme: false
     }
     });*/

});

//Flot Multiple Axes Line Chart
$(function () {

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

});

//Flot Moving Line Chart

$(function () {



    // Update the random dataset at 25FPS for a smoothly-animating chart

    setInterval(function updateRandom() {
        //series[0].data = getRandomData();
        //plot.setData(series);
        //plot.draw();
    }, 40);

});
