t = "MTL"
var allData, c
parseTime = d3.timeParse("%B %d %Y");
formatTime = d3.timeFormat("%m/%d");

var dat = []
var teaminfo, x, y, height, width, hoverHide, hover

height = 120



function hover(actualTime) {
    d3.selectAll('.hover').style('opacity', 1)

    games.forEach(function(d) {
        // console.log(d)
        var time = Math.max(0, actualTime)
        var sec = padTime(time % 1 * 60)
        d.xText.text(padTime(time) + ':' + sec)
            .attr('x', x(time))
        // console.log(d)
        var i = clamp(0, d3.bisectLeft(d.negMin, -time), d.length - 1)
        var diff = d[i].shotdff
        // console.log(diff)
        d.yText.text(diff).attr('y', y(diff))
        // console.log(height)
        d.xLine.attr('d', ['M', x(time), height + 4, 'L', x(time), y(diff)].join(' '))
        d.yLine.attr('d', ['M', -3, y(diff), 'L', x(time), y(diff)].join(' '))

        d.hover.classed('neg', diff < 0)

    })
}

function hoverHide() {
    d3.selectAll('.hover').style('opacity', 0)
}

function padTime(d) {
    return d3.format('02d')(Math.floor(Math.abs(d)))
}

d3.loadData(["allgamesinfo.csv", "allgames.csv"], function(err, res) {
    // console.log(res)
    teaminfo = res[1]
    allData = res[0]
    res[0].forEach(function(d) {
        if (d["home"] == t || d["away"] == t) {
            dat.push(d)
        }
    })

    games = []
    dat.forEach(function(d) {
        // console.log(d)
        var filteredData = _(res[1]).filter(function(i) {
            i.shotdff = +i.shotdff
            i.seconds = +i.seconds
            i.min = 60 - (i.seconds / 60)
            // i.negMin = -i.min
            return d.gcode === i.gcode;

        });
        games.push(filteredData)
    })

    games.forEach(function(d, i) {
        d.date = dat[i].date.replace(/,/g, " ")
        d.finalscore = dat[i].scorehome + "-" + dat[i].scoreaway
        d.home = dat[i].home
        d.away = dat[i].away
        d.diffExtent = d3.extent(d, function(d) {
            return d.shotdff;
        })
        d.negMin = d.map(function(d) {
            return -d.min
        })
    })
    console.log(games)

    diffExtent = d3.extent(_.flatten(games.map(function(d) {
        return d.diffExtent;
    })))
    console.log(diffExtent)

    console.log(games)
    // gameSel = d3.select('#graph').appendMany(games, 'div.game')
    gameSel = d3.select('#graph').selectAll("div.game")
        .data(games)
        .enter()
        .append('div.game')



    gameSel.append('div.date').text(function(d) {
        return formatTime(parseTime(d.date))
    })
    gameSel.append('div.team').text(function(d) {
        return d.home == t ? '@' + d.away : d.home
    })
    gameSel.append('div.score').text(function(d) {
        return d.finalscore
    })

    console.log(gameSel)

    gameSel.each(function(d, i) {
        var margin = {
                top: 10,
                right: 25,
                bottom: 10,
                left: 25
            },
            width = 195 - margin.left - margin.right,
            height = 150 - margin.top - margin.bottom;
        console.log(height)
        // c = d3.conventions({
        //     parentSel: d3.select(this),
        //     height: 150,
        //     width: 195,
        //     margin: {
        //         left: 25,
        //         top: 10,
        //         bottom: 10,
        //         right: 25
        //     }
        // })
        svg = d3.select(this).append('svg')
            .attr('width', 195 + margin.left + margin.right)
            .attr('height', 120 + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var xAxis = d3.axisBottom()
            .scale(x)
        // .orient("bottom");

        var yAxis = d3.axisLeft()
            .scale(y)
        // .orient("left");

        x = d3.scaleLinear()
            .range([0, width]);

        y = d3.scaleLinear()
            .range([height, 0]);


        x.domain([60, 0])
        y.domain(diffExtent)
        y.domain([-20, 20])

        yAxis.tickValues([-15, -10, -5, 0, 5, 10, 15])
        xAxis.tickValues([60, 40, 20])

        svg.append("g")
            .call(d3.axisLeft()
                .scale(y)
                .tickValues([-15, -10, -5, 0, 5, 10, 15])
            )
            .attr('class', 'axis');

        svg.append("g")
            .call(d3.axisBottom()
                .scale(x)
                .tickValues([60, 40, 20])
            )
            .attr("transform", "translate(0," + height + ")")
            .attr('class', 'x line axis');

        svg.selectAll('.x line')
            .attr('y1', -120)


        svg.append('path.zero').attr('d', ['M', [0, y(0)], 'h', width].join(''))

        svg.append('clipPath').attr('id', 'clip' + d.gcode)
            .append('rect')
            .attr('y', y(0))
            .attr('width', width)
            .attr('height', height)


        var line = d3.line()
            .x(function(d) {
                // console.log(d)
                return x(d['min'])
            })
            .y(function(d) {
                return y(d['shotdff'])
            })
            .curve(d3.curveStep)
        // .attr("class", "line")

        var area = d3.area()
            .x(function(d) {
                return x(d['min'])
            })
            .y0(function(d) {
                return y(d['shotdff'])
            })
            .y1(y(0))
            .curve(d3.curveStep)

        svg.append('path.score-line')
            .attr('d', line(d))

        svg.append('path.area')
            .attr('d', area(d))
            .attr('clip-path', 'url(#clip' + d.gcode + ')')

        svg.selectAll('circle')
            .data(d)
            .enter()
            .append('circle')
            .filter(function(d) {
                return d.etype == 'GOAL'
            })
            .attr("cx", function(d) {
                return x(d['min'])
            })
            .attr("cy", function(d) {
                return y(d['shotdff'])
            })
            .attr('fill', 'none')
            .attr("data-legend", function(d) {
                return d.name
            })
            .attr("data-legend-icon", function(d) {
                return "circle"
            })
            .attr('stroke', function(d) {
                // console.log(d['ev.team'])
                if (d['ev.team'] == t) {
                    return '#1f78b4'
                } else {
                    return '#e31a1c'
                }
            })
            .attr('r', 4)
            .attr('stroke-width', 1)



        d.hover = svg.append('g') //.style('opacity', .9)
        d.xLine = d.hover.append('path.hover')
        d.yLine = d.hover.append('path.hover')
        d.xText = d.hover.append('text.hover').attr('y', height + 9).attr('dy', '.71em').attr('text-anchor', 'middle')
        d.yText = d.hover.append('text.hover').attr('x', -9).attr('dy', '.32em').attr('text-anchor', 'end')
        // d.c = c

        svg.append('rect')
            .attr('x', 0)
            .attr('y', -30)
            .attr('width', x(0))
            .attr('height', height + 30 * 2)
            .style('opacity', 0)

        svg
            .on('mousemove', function() {
                console.log(height)
                hover(x.invert(d3.mouse(this)[0]))
            })
            .on('mouseout', hoverHide)


    })
    var legendScale = d3.scaleOrdinal()
        .domain(['Goal for', 'Goal against'])
        .range(['for', 'against'])

    //d3-legend
      var legend = d3.legendColor()
        .shape('circle')
        .shapeRadius(4)
        .useClass(true)
        .scale(legendScale);


    d3.select('#graph').select("svg").append('g')
        .attr('transform', 'translate(800,-60)')
        .call(legend);

    d3.select(self.frameElement).style('height', d3.select('svg').attr('height') + "px");
    //create legend

})

function clamp(a, b, c) {
    return Math.max(a, Math.min(b, c))
}


var legendScale = d3.scaleOrdinal()
    .domain(['Goal for', 'Goal against'])
    .range(['for', 'against'])

//d3-legend
var legend = d3.legendColor()
    .shapePadding(5)
    .shape('circle')
    .useClass(true)
    .scale(legendScale);

d3.select('#graph').select("svg").append('g')
    .attr('transform', 'translate(800,-60)')
    .call(legend);

function updateGraph(t) {
    dat = []
    allData.forEach(function(d) {
        if (d["home"] == t || d["away"] == t) {
            dat.push(d)
        }
    })
    console.log(dat)


    games = []
    dat.forEach(function(d) {
        // console.log(d)
        var filteredData = _(teaminfo).filter(function(i) {
            i.shotdff = +i.shotdff
            i.seconds = +i.seconds
            i.min = 60 - (i.seconds / 60)
            // i.negMin = -i.min
            return d.gcode === i.gcode;

        });
        games.push(filteredData)
    })

    games.forEach(function(d, i) {
        d.date = dat[i].date.replace(/,/g, " ")
        d.finalscore = dat[i].scorehome + "-" + dat[i].scoreaway
        d.home = dat[i].home
        d.away = dat[i].away
        d.diffExtent = d3.extent(d, function(d) {
            return d.shotdff;
        })
        d.negMin = d.map(function(d) {
            return -d.min
        })
    })
    // console.log(games)

    diffExtent = d3.extent(_.flatten(games.map(function(d) {
        return d.diffExtent;
    })))
    // console.log(diffExtent)
    // debugger
    // gameSel = d3.select('#graph').selectAll("div.game")
    //     .data(games)
    //     .enter()
    //     .append('div.game')
    // gameSel.exit()
    //  .transition()
    //  .duration(1000)
    //  .remove()

    console.log(games)


    // = d3.select('#graph')
    d3.select('#graph').selectAll("div.game").remove()
    gameSel = d3.select('#graph').selectAll("div.game")
        .data(games)
        .enter()
        .append('div.game')
    gameSel.append('div.date').text(function(d) {
        return formatTime(parseTime(d.date))
    })
    gameSel.append('div.team').text(function(d) {
        return d.home == t ? '@' + d.away : d.home
    })
    gameSel.append('div.score').text(function(d) {
        return d.finalscore
    })

    console.log(gameSel)

    gameSel.each(function(d, i) {
        var margin = {
                top: 10,
                right: 25,
                bottom: 10,
                left: 25
            },
            width = 195 - margin.left - margin.right,
            height = 150 - margin.top - margin.bottom;
        console.log(height)
        // c = d3.conventions({
        //     parentSel: d3.select(this),
        //     height: 150,
        //     width: 195,
        //     margin: {
        //         left: 25,
        //         top: 10,
        //         bottom: 10,
        //         right: 25
        //     }
        // })
        svg = d3.select(this).append('svg')
            .attr('width', 195 + margin.left + margin.right)
            .attr('height', 120 + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var xAxis = d3.axisBottom()
            .scale(x)
            // .orient("bottom");

        var yAxis = d3.axisLeft()
            .scale(y)
            // .orient("left");

        x = d3.scaleLinear()
            .range([0, width]);

        y = d3.scaleLinear()
            .range([height, 0]);

        x.domain([60, 0])
        y.domain(diffExtent)
        y.domain([-20, 20])

        yAxis.tickValues([-15, -10, -5, 0, 5, 10, 15])
        xAxis.tickValues([60, 40, 20])

        svg.append("g")
            .call(d3.axisLeft()
                .scale(y)
                .tickValues([-15, -10, -5, 0, 5, 10, 15])
            )
            .attr('class', 'axis');

        svg.append("g")
            .call(d3.axisBottom()
                .scale(x)
                .tickValues([60, 40, 20])
            )
            .attr("transform", "translate(0," + height + ")")
            .attr('class', 'x line axis');

        svg.selectAll('.x line')
            .attr('y1', -120)



        svg.append('path.zero').attr('d', ['M', [0, y(0)], 'h', width].join(''))

        svg.append('clipPath').attr('id', 'clip' + d.gcode)
            .append('rect')
            .attr('y', y(0))
            .attr('width', width)
            .attr('height', height)


        var line = d3.line()
            .x(function(d) {
                // console.log(d)
                return x(d['min'])
            })
            .y(function(d) {
                return y(d['shotdff'])
            })
            .curve(d3.curveStep)
        // .attr("class", "line")

        var area = d3.area()
            .x(function(d) {
                return x(d['min'])
            })
            .y0(function(d) {
                return y(d['shotdff'])
            })
            .y1(y(0))
            .curve(d3.curveStep)

        svg.append('path.score-line')
            .attr('d', line(d))

        svg.append('path.area')
            .attr('d', area(d))
            .attr('clip-path', 'url(#clip' + d.gcode + ')')

        svg.selectAll('circle')
            .data(d)
            .enter()
            .append('circle')
            .filter(function(d) {
                return d.etype == 'GOAL'
            })
            .attr("cx", function(d) {
                return x(d['min'])
            })
            .attr("cy", function(d) {
                return y(d['shotdff'])
            })
            .attr('fill', 'none')
            .attr('stroke', function(d) {
                // console.log(d['ev.team'])
                if (d['ev.team'] == t) {
                    return '#1f78b4'
                } else {
                    return '#e31a1c'
                }
            })
            .attr('r', 4)
            .attr('stroke-width', 1)

        d.hover = svg.append('g') //.style('opacity', .9)
        d.xLine = d.hover.append('path.hover')
        d.yLine = d.hover.append('path.hover')
        d.xText = d.hover.append('text.hover').attr('y', height + 9).attr('dy', '.71em').attr('text-anchor', 'middle')
        d.yText = d.hover.append('text.hover').attr('x', -9).attr('dy', '.32em').attr('text-anchor', 'end')
        // // d.c = c

        svg.append('rect')
            .attr('x', 0)
            .attr('y', -30)
            .attr('width', x(0))
            .attr('height', height + 30 * 2)
            .style('opacity', 0)

        svg
            .on('mousemove', function() {
                console.log(height)
                hover(x.invert(d3.mouse(this)[0]))
            })
            .on('mouseout', hoverHide)


    })
    // console.log(gameSel1)
    //     // .data(games)
    // .enter()
    // .append('div.game')

    // gameSel.exit().remove()

    // gameSel.enter()
    //     .append('div.game')

    var legendScale = d3.scaleOrdinal()
        .domain(['Goal for', 'Goal against'])
        .range(['for', 'against'])

    //d3-legend
    var legend = d3.legendColor()
        .shape('circle')
        .shapeRadius(4)
        .useClass(true)
        .scale(legendScale);

    d3.select('#graph').select("svg").append('g')
        .attr('transform', 'translate(800,-60)')
        .call(legend);

    console.log(gameSel)

    line = d3.line()
        .x(function(d) {
            // console.log(d)
            return x(d['min'])
        })
        .y(function(d) {
            return y(d['shotdff'])
        })
        .curve(d3.curveStep)




    // gameSel1._groups[0].forEach(function(d, i) {
    //     console.log(svg)
    // gameSel.selectAll('path.score-line')
    //     .data(games)
    //     .enter()
    //     .append('path.score-line')
    //     .attr('d',function(d){
    //     return line(d)
    // })

    // })

    //           var area = d3.area()
    //           .x(function(d) {
    //               return c.x(d['min'])
    //           })
    //           .y0(function(d) {
    //               return c.y(d['shotdff'])
    //           })
    //           .y1(c.y(0))
    //           .curve(d3.curveStep)

    //       // c.svg.append('path.score-line')
    //       //     .attr('d', line(d))

    //       c.svg.select('path.area')
    //       .transition()
    // .duration(1000)
    //           .attr('d', area(d))
    // .attr('clip-path', 'url(#clip' + d.gcode + ')')

    // gameSel = d3.select('#graph').appendMany(games, 'div.game')

    // console.log(gameSel1)




    // .attr('d', line(d))
    // gameSel = d3.select('#graph').selectAll("div.game")
    //     .data(games)
    //     .enter()
    //     .append('div.game')

    // games.forEach(function(d, i) {
    // console.log(i)

    // t = d3.select(c).transition();



    // gameSel = d3.selectAll("div.game").selectAll("path.score-line")
    //      // .data(games)
    //     // .select("path.score-line")
    // .transition()
    //     .duration(1000)
    //     .attr("d", line(games))
    // gameSel.each(function(d, i) {
    //  // console.log(d)
    //         c.svg.append('path.score-line')
    //                     .transition()
    //     .duration(1000)
    //             .attr('d', line(d))

    //     })



    // Line_chart = d3.selectAll("div.game").selectAll("path.score-line");

    // Line_chart
    //  .data(games.forEach(function(d){
    //      return d
    //  }))

    // console.log(Line_chart)



    // Line_chart._parents.forEach(function(d,i){
    //  d3.select('path.score-line').transition()
    //     .duration(1000)
    //     .attr("d", line(games[i]))
    // })


    // })

}

$(document).ready(function() {
    $('.teams').on('change', function() {
        team_name = $('.teams').val();
        // document.getElementById("title").innerHTML = $('.teams').val();
        console.log(team_name)

        // updateChords( "Arizona_matrix.json" );
        updateGraph(team_name);


    });

});