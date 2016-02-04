/**
 * This controller uses th eaggrStringAttrService to get samples from sth-comet. It draw them in a graph using the
 * directive provided by angular-nvd3
 */
myApp.controller('aggrStringAttrCtrl', function ($scope, $locale, aggrStringAttrSrv) {

    var MIN_TICK_WIDTH = 40, // px
        MARGIN = {
            top: 30,
            right: 20,
            bottom: 100,
            left: 60
        };

    /**
     * d3 locales. Example of how to use angular-i18n to configure d3 locales for the graph. This has been configured
     * to use es-es (see aggrStringAttr.html)
     */

    var d3Locale = d3.locale({
        decimal: $locale.NUMBER_FORMATS.DECIMAL_SEP,
        thousands: $locale.NUMBER_FORMATS.GROUP_SEP,
        grouping: '[3]',
        currency: '["", " €"]',
        dateTime: '%A, %e de %B de %Y, %X',
        date: '%d/%m/%Y',
        time: '%H:%M',
        periods: $locale.DATETIME_FORMATS.AMPMS,
        days: $locale.DATETIME_FORMATS.DAY,
        shortDays: $locale.DATETIME_FORMATS.SHORTDAY,
        months: $locale.DATETIME_FORMATS.MONTH,
        shortMonths: $locale.DATETIME_FORMATS.SHORTMONTH
    });

    /**
     * Angular-nvd3 provides a JSON way to define the chart properties. We will fill it later on,
     * when the data is returned by the service. See NVD3 doc to know more about the available properties
     */
    $scope.chart = {
        config: {
            deepWatchData: true,
            refreshDataOnly: false,
            visible: false
        },
        data: [],
        options: {}
    };


    /**
     * This method is an example of how to customize our nvd3 graph using native d3.
     * It generates a discrete domain simulating a continuous time domain. The resolution of the domain depends
     * on the chosen aggregation period.
     * This is necessary since multiBarChart doesn't allow continuous domains. So we simulate it.
     * Creating a custom xDomain will allow specifying which ticks we want in our xAxis (every day, ever hour... etc.)
     * If you don't create your own domain, Nvd3 will choose which ticks to show, depending on the received data.
     * @return {Array} d3 range. A set of dates
     * @private
     */
    var _getXdomain = function() {
        var interval = $scope.aggregationPeriod;
        //use d3 time intervals ranges to avoid problems with timezones and daily saving time
        return d3.time[interval].range($scope.beginDate, $scope.endDate, 1);
    };

    /**
     * this method allows selecting a set of ticks of the xdomain, so that the points shown in xAxis can be readable.
     * For example, show only 1 out of 3 ticks.
     * Based on the available width of the graph, it calculates how many readable ticks can be shown in the xAxis.
     * @param xdomain
     * @returns d3 range
     * @private
     */
    var _getXTickValues = function(xdomain) {
        var divisor = {
                day: 1,      // show every tick
                hour: 24,    // show a tick every 24 hours
                minute: 60   // show a tick every hour
            },
            nTicks = xdomain.length / divisor[$scope.aggregationPeriod],
            container = d3.select('.chart-container'),
            availableWidth = nv.utils.availableWidth(null, container, MARGIN),
            maxTicks = parseInt(availableWidth / MIN_TICK_WIDTH),
            tickProportion = (nTicks > maxTicks) ? Math.round(nTicks / maxTicks) : 1, //to show only some ticks
            count = -1;

        return xdomain.filter(function(date) {
            switch ($scope.aggregationPeriod) {
                case 'day':
                case 'hour': //only 00:00 ticks (days)
                    if (date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0) {
                        count++;
                        if (count % tickProportion === 0) { // Make them readable
                            return date;
                        }
                    }
                    break;
                case 'minute': //only XX:00 ticks (hours)
                    if (date.getMinutes() === 0 && date.getSeconds() === 0) {
                        count++;
                        if (count % tickProportion === 0) { // Make them readable
                            return date;
                        }
                    }
                    break;
            }
        });
    };

    /**
     * Customize the format that will be shown in each xTick label in xAxis
     * @param d
     * @returns a time format depending on the locale
     * @private
     */
    var _getXTickFormat = function(d) {

        switch ($scope.aggregationPeriod) {
            case 'day':
            case 'hour':
                return d3Locale.timeFormat('%x')(d);        // format in days
            case 'minute':
            case 'second':
                return d3Locale.timeFormat('%x %X')(d); // format in day-hour (no secs)
        }
    };

    /*
     * Customize Tooltip
     */

    var _tooltipHeaderFormatter = function(d) {
        switch ($scope.aggregationPeriod) {
            case 'day':
                return d3Locale.timeFormat('%x')(d);       // format in days
            case 'hour':
            case 'minute':
                return d3Locale.timeFormat('%x %X')(d); // format in day-hour (no secs)
        }
    };

     /**
     * Custom tooltip to add a special header. Based on the html of the basic tooltip of multibarChart
     * @param {Object} obj data passed by nvd3 for multibarChart to generate the info about the value (color, data)
     * @return {string} the html to render the tooltip.
     * @private
     */
    var _tooltipContentGenerator = function(obj) {
        return '<h3><strong>' + _tooltipHeaderFormatter(obj.data[0]) + '</strong></h3>' +
            '<table><tr>' +
            '<td class="legend-color-guide"><div style="background-color: ' + obj.color + ';"></div></td>' +
            '<td class="key">' + obj.data.key + '</td>' +
            '<td class="value">' + (obj.data[1]) + '</td></tr>' +
            '</tr></table>';
     };

    /**
     * Configures a bar chart that can represent different sets of data. Each color represents one of the sets.
     * Those sets can be displayed in stack mode or group mode
     * @param {Object} aggrData an object with
     *     - method by which the data has been aggregated
     *     - data an array of objects. Each object represent a set of data {key, values}
     * @private
     */
    var _drawChart = function(aggrData) {
        var data = aggrData.data,
            xdomain = _getXdomain();

        $scope.chart.config.visible = true;
        $scope.chart.options.chart = {
            type: 'multiBarChart',
            margin: MARGIN,
            noData: 'No data stored in STH',
            controlLabels: {
                stacked: 'stacked',
                grouped: 'grouped'
            },
            x: function(d) {
                return d[0];
            },
            y: function(d) {
                return d[1];
            },
            clipEdge: true,
            showValues: true,
            xDomain: xdomain,
            duration: 500,
            stacked: true,
            showLegend: true,
            showControls: true,
            reduceXTicks: false,
            xAxis: {
                axisLabel: 'dates',
                showMaxMin: false,
                rotateLabels: 30,
                tickPadding: 5,
                tickValues: _getXTickValues(xdomain),
                tickFormat: _getXTickFormat
            },
            yAxis: {
                axisLabel: $scope.attrName
            },
            tooltip: {
                contentGenerator: _tooltipContentGenerator
            },
            dispatch: {
                // special zoom. angular-nvd3 zoom is not valid for ordinal scales. This is a custom zoom
                // implemented using d3 . Based on this example: http://jsfiddle.net/9rypxf10/
                renderEnd: function() {
                    var svg = $scope.chart.api.getScope().svg,
                        bars = d3.selectAll('.nv-group'),
                        xAxis = svg.select('.nv-x.nv-axis'),
                        width = nv.utils.availableWidth(null, svg, MARGIN),
                        height = nv.utils.availableHeight(null, svg, MARGIN) + MARGIN.bottom,
                        xAxisTranslateY = d3.transform(xAxis.attr('transform')).translate[1],
                        defs,
                        rect,
                        xWrap = xAxis.select('.nvd3.nv-wrap.nv-axis');

                    var _moveBars = function(x, y, scale) {
                        bars.attr('transform',
                            'translate(' + x + ',' + y + ') scale(' + scale + ',1)');
                    };

                    var _moveXWrap = function(x, y) {
                        xWrap.attr('transform',
                            'translate(' + x + ', ' + y + ')');
                    };

                    //add a clipPath for xAxis, in order to hide the ticks that overflow the graph
                    //bars have their own clipPath thanks to "clipEdge = true" property in nvd3 multibarchart.
                    rect = xAxis.select('defs #clip-x-axis rect');
                    if (rect.empty()) {
                        defs = (xAxis.select('defs').empty()) ? xAxis.append('defs') : xAxis.select('defs');
                        rect = defs.append('clipPath')
                            .attr('id', 'clip-x-axis')
                            .append('rect');
                    }
                    rect.attr('width', width)
                        .attr('height', height)
                        .attr('transform', 'translate(0, -' + xAxisTranslateY + ')');

                    xAxis.attr('clip-path', 'url(#clip-x-axis)');

                    _moveBars(0, 0, 1);
                    _moveXWrap(0, 0);


                    /**
                     * translates and scales both, bars and xAxis
                     */
                    function zoomed() {
                        var chart = $scope.chart.api.getScope().chart;

                        _moveBars(d3.event.translate[0], 0, d3.event.scale);
                        _moveXWrap(d3.event.translate[0], 0);

                        xAxis
                            .call(chart.xAxis
                                .scale(chart.xAxis.scale().rangeBands([0, width * d3.event.scale], 0.1)));
                    }

                    var d3zoom = d3.behavior.zoom()
                        .scaleExtent([1, 10])
                        .on('zoom', zoomed);

                    $scope.chart.api.getScope().svg.call(d3zoom);
                }
            }
        };

        // Fill data keeping the original array. As it is an update of the same array, the chart is correctly refreshed.
        $scope.chart.data.length = 0;
        angular.forEach(data, function(d) {
            $scope.chart.data.push(d);
        });
    };

    /**
     * Ask for new data to draw the chart
     */
    $scope.loadChart = function() {
        var interval = {
            dateFrom: $scope.beginDate,
            dateTo: $scope.endDate,
            aggrPeriod: $scope.aggregationPeriod
        };

        aggrStringAttrSrv.getAggregated($scope.entityId, $scope.entityType, $scope.attrName, interval).then(_drawChart);
    };

    var init = function() {
        //change this attributes if you want to query your own data in your own sth-comet instance
        $scope.entityId = 'button-id2';
        $scope.entityType = 'BlackButton';
        $scope.attrName = 'op_status';
        $scope.beginDate = new Date('2015-11-12T00:00:00.000Z');
        $scope.endDate = new Date('2015-11-17T23:00:00.000Z');

        $scope.aggregationPeriod = 'hour';

        $scope.loadChart();
    };

    init();
})