t = "MTL"
var allData, c
parseTime = d3.timeParse("%B %d %Y");
formatTime = d3.timeFormat("%m/%d");

var dat = []
var teaminfo, x, y, height, width

var height = 150

var period=['p1','p2','p3']
function hover(actualTime) {
    d3.selectAll('.hover').style('opacity', 1)


    games.forEach(function(d) {
        // console.log(actualTime)
        var time = Math.max(0, actualTime)
        // console.log(time)
        var sec = padTime(time % 1 * 60)
        d.xText.text(padTime(time) + ':' + sec)
            .attr('x', x(time))
        // console.log(-time)

        var i = clamp(0, d3.bisectLeft(d.negMin, -time) - 1, d.length - 1)
        // console.log(i)
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
    // console.log(res[1])

    teaminfo = res[1]
    allData = res[0]
    res[0].forEach(function(d) {
        if (d["home"] == t || d["away"] == t) {
            dat.push(d)
        }
    })

    games = []
    console.log(res[1])
    dat.forEach(function(d) {

        var filteredData = _(res[1]).filter(function(i) {
            i.shotdff = +i.shotdff
            i.seconds = +i.seconds
            i.min = 60 - (i.seconds / 60)
            // i.negMin = -i.min
            return d.gcode === i.gcode;

        });
        // make selected team always positive if they shoot first
        if (filteredData[0]['ev.team'] == t && Math.sign(filteredData[0].shotdff) == -1 || filteredData[0]['ev.team'] != t && Math.sign(filteredData[0].shotdff) == 1) {
            filteredData.forEach(function(d) {
                if (Math.sign(d.shotdff) == -1)
                    d.shotdff = Math.sign(d.shotdff) * d.shotdff
                else
                    d.shotdff = -Math.sign(d.shotdff) * d.shotdff
            })
        }
        filteredData.splice(0, 0, {
            shotdff: 0,
            seconds: 0,
            min: 60.00,
            etype: "SHOT",
            'ev.team': t

        })
        games.push(filteredData)
    })
    // var changepos, changeneg

    // if(games[0].ev.team == t && games[0].shotdff ==-1){
    //     changepos = true;
    // }else if(games[0].ev.team != t && games[0].shotdff ==1 ) {
    //     changeneg = true;
    // }
    games.forEach(function(d, i) {
        if(dat[i].home == t && dat[i].scorehome > dat[i].scoreaway){
            outcome = 'W'
        }else if (dat[i].away == t && dat[i].scoreaway > dat[i].scorehome){
            outcome = 'W'
        }else{
            outcome = 'L'
        }
        // console.log(dat[i])
        d.date = dat[i].date.replace(/,/g, " ")
        d.finalscore = outcome+ ' ' +dat[i].scorehome + "-" + dat[i].scoreaway
        d.home = dat[i].home
        d.away = dat[i].away

        d.diffExtent = d3.extent(d, function(d) {
            return d.shotdff;
        })
        d.negMin = d.map(function(d) {
            // console.log(d)
            return -d.min
        })

    })
    // console.log(games)

    diffExtent = d3.extent(_.flatten(games.map(function(d) {
        return d.diffExtent;
    })))
    // console.log(diffExtent)

    // console.log(games)
    // gameSel = d3.select('#graph').appendMany(games, 'div.game')
    gameSel = d3.select('#graph').selectAll("div.game")
        .data(games)
        .enter()
        .append('div.game')



    gameSel.append('div.date').text(function(d) {
        return formatTime(parseTime(d.date))
    })
    gameSel.append('div.team').text(function(d) {
        return d.home != t ? '@' + d.home : d.away
    })
    gameSel.append('div.score').text(function(d) {
        return d.finalscore
    })

    // console.log(gameSel)

    gameSel.each(function(d, i) {
        var
            width = 195 //- margin.left - margin.right,
        height = 150 //- margin.top - margin.bottom;
        // console.log(height)
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
            .attr('width', 195) //+ margin.left + margin.right)
            .attr('height', 150) //+ margin.top + margin.bottom)
            .append("g")
        // .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


        // .orient("left");

        x = d3.scaleLinear()
            .range([0, width]);

        y = d3.scaleLinear()
            .range([height, 0]);
        var xAxis = d3.axisBottom()
            .scale(x)
        // .orient("bottom");

        var yAxis = d3.axisLeft()
            .scale(y)

        x.domain([60, 0])
        y.domain(diffExtent)
        y.domain([-20, 20])



        // yAxis.tickValues([-15, -10, -5, 0, 5, 10, 15])
        // xAxis.tickValues([60, 40, 20])

        svg.append("g")
            .call(d3.axisLeft()
                .scale(y)
                .tickValues([-15, -10, -5, 0, 5, 10, 15])

            )
            .attr('class', 'y axis');

        svg.append("g")
            .call(d3.axisBottom()
                .scale(x)
                .tickValues([60, 40, 20,0])
                .tickFormat(function(d,i){
                    return period[i]
                })
            )
            .attr("transform", "translate(0," + height + ")")
            .attr('class', 'x line axis');

        svg.selectAll('.x line')
            .attr('y1', -height)


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
                // console.log(d)
                return y(d['shotdff'])
            })
            .curve(d3.curveStepAfter)
        // .attr("class", "line")

        var area = d3.area()
            .x(function(d) {
                return x(d['min'])
            })
            .y0(function(d) {
                return y(d['shotdff'])
            })
            .y1(y(0))
            .curve(d3.curveStepAfter)

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
            .attr('fill','none')
            // .attr('fill', function(d) {
            //     // console.log(d['ev.team'])
            //     if (d['ev.team'] == t) {
            //         return '#377eb8'
            //     } else {
            //         return '#e31a1c'
            //     }
            // })
            // .attr('fill-opacity',.4)
            .attr('stroke', function(d) {
                // console.log(d['ev.team'])
                if (d['ev.team'] == t) {
                    return 'black'
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
                // console.log(d3.mouse(this)[0])
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
    // console.log(Math.max(a, Math.min(b, c)))
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
    // console.log(dat)


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
        // console.log(filteredData[0])
        if (filteredData[0]['ev.team'] == t && Math.sign(filteredData[0].shotdff) == -1 || filteredData[0]['ev.team'] != t && Math.sign(filteredData[0].shotdff) == 1) {
            filteredData.forEach(function(d) {
                if (Math.sign(d.shotdff) == -1)
                    d.shotdff = Math.sign(d.shotdff) * d.shotdff
                else
                    d.shotdff = -Math.sign(d.shotdff) * d.shotdff
            })
        }

        games.push(filteredData)
    })

    games.forEach(function(d, i) {
        console.log(t)
        if(dat[i].home == t && dat[i].scorehome > dat[i].scoreaway){
            console.log(dat[i])
            outcome = 'W'
        }else if (dat[i].away == t && dat[i].scoreaway > dat[i].scorehome){
            outcome = 'W'
        }else{
            outcome = 'L'
        }
        d.date = dat[i].date.replace(/,/g, " ")
        d.finalscore = outcome + ' ' +dat[i].scorehome + "-" + dat[i].scoreaway
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

    // console.log(games)


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
        // console.log(d)
        return d.home != t ? '@' + d.home : d.away
    })
    gameSel.append('div.score').text(function(d) {
        return d.finalscore
    })

    // console.log(gameSel)

    gameSel.each(function(d, i) {
        var
            width = 195,
            height = 150;
        // console.log(height)
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
            .attr('width', 195 )
            .attr('height', 150 )
            .append("g")
            // .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

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


        svg.append("g")
            .call(d3.axisLeft()
                .scale(y)
                .tickValues([-15, -10, -5, 0, 5, 10, 15])
            )
            .attr('class', 'y axis');

        svg.append("g")
            .call(d3.axisBottom()
                .scale(x)
                .tickValues([60, 40, 20,0])
                .tickFormat(function(d,i){
                    return period[i]
                })
            )
            .attr("transform", "translate(0," + height + ")")
            .attr('class', 'x line axis');

        svg.selectAll('.x line')
            .attr('y1', -height)



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
            .curve(d3.curveStepAfter)
        // .attr("class", "line")

        var area = d3.area()
            .x(function(d) {
                return x(d['min'])
            })
            .y0(function(d) {
                return y(d['shotdff'])
            })
            .y1(y(0))
            .curve(d3.curveStepAfter)

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
                    return 'black'
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


}

$(document).ready(function() {
    $('.teams').on('change', function() {
        team_name = $('.teams').val();
        // document.getElementById("title").innerHTML = $('.teams').val();

        // updateChords( "Arizona_matrix.json" );
        updateGraph(team_name);


    });

});