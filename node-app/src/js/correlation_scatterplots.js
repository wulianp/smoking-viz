import * as d3 from 'd3'
import * as jStat from 'jStat'

// Plot current menu choice to start out
var option = document.getElementById("scatter_time_interval_menu");

// Plot stress vs hrv
var filename = `data/stress_${option.value}.csv`;
plot_scatter(filename, "stress");

// Plot urge vs hrv
filename = `data/urge_${option.value}.csv`;
plot_scatter(filename, "urge");

function clearBox(elementID)
{
    document.getElementById(elementID).innerHTML = "";
}

// Update plots when new time interval changes
document.getElementById("scatter_time_interval_menu").onchange = function() {
    // Plot stress vs hrv
    var filename = `data/stress_${this.value}.csv`;
    clearBox("stress_scatter")
    plot_scatter(filename, "stress");
    
    // Plot urge vs hrv
    filename = `data/urge_${this.value}.csv`;
    clearBox("urge_scatter")
    plot_scatter(filename, "urge");

    return false
};

function plot_scatter(filename, viz_id) {
    // Set up plot margins
    var margin = {top: 20, right: 20, bottom: 50, left: 50},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

    width = 400;
    height = 400;

    // setup x 
    var xValue = function(d) { return d.hrv;}, // data -> value
    xScale = d3.scaleLinear().range([0, width]), // value -> display
    xMap = function(d) { return xScale(xValue(d));}, // data -> display
    xAxis = d3.axisBottom().scale(xScale);

    // setup y
    var yValue = function(d) { return d.self_report;}, // data -> value
    yScale = d3.scaleLinear().range([height, 0]), // value -> display
    yMap = function(d) { return yScale(yValue(d));}, // data -> display
    yAxis = d3.axisLeft().scale(yScale);

    // Add the graph canvas to w/in div
    var svg = d3.select("#"+viz_id+"_scatter").append("svg")
    .attr("width", width + margin.left + margin.right,)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // add the tooltip area to the webpage
    var tooltip = d3.select("#"+viz_id+"_scatter").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
    
    // Load the data
    d3.csv(filename, function(error, data) {
        var x = data.map(d => +d[viz_id+"_score"]);
        var y = data.map(d => +d["hrv_score"]);
        
        // Compute linear correlation corefficients
        show_pearsons(x, y, viz_id);
        show_spearmans(x, y, viz_id);
        
        // Plotting linear regression model
        var lr = linearRegression(x, y);
        var myLine = svg.append("svg:line")
            .attr("x1", xScale(0))
            .attr("y1", yScale(lr.intercept))
            .attr("x2", xScale(1))
            .attr("y2", yScale((1*lr.slope) + lr.intercept))
            .style("stroke", "black");

        console.log("Loading scatterplot values...");
        data.forEach(function(d) {
            if (!isNaN(d.hrv_score) || !isNaN(d[viz_id+"_score"])) {
                d.datetime = d["datetime"];
                d.self_report = +d[viz_id+"_score"];
                d.hrv = +d["hrv_score"];
            }
        });

    // don't want dots overlapping axis, so add in buffer to data domain
    xScale.domain([d3.min(data, xValue), d3.max(data, xValue)]);
    yScale.domain([d3.min(data, yValue), d3.max(data, yValue)]);

    // x-axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .append("text")
        .attr("class", "label")
        .attr("x", width/2)
        .attr("y", 25)
        .style("text-anchor", "end")

    // y-axis
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("y", 500)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
    
    // x-axis label
    svg.append("text")
        .attr("x", width/2)
        .attr("y", height + margin.bottom - 10)
        .style("text-anchor", "middle")
        .text(viz_id+" scaled z-score");

    // y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x",0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("HRV scaled z-score");

    // draw dots
    svg.selectAll(".dot")
        .data(data)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("r", 3.5)
        .attr("cx", xMap)
        .attr("cy", yMap)
        .on("mouseover", function(d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(new Date(Date.parse(d.datetime)).toLocaleDateString() + 
                "<br/> (" + xValue(d).toFixed(2) 
                + ", " + yValue(d).toFixed(2) + ")")
                .style("left", (d3.event.pageX - 300) + "px")
                .style("top", (d3.event.pageY - 280) + "px");
        })
        .on("mouseout", function(d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });
    });
}

function show_pearsons(x, y, viz_id) {
    let coeff = jStat.corrcoeff(x, y);
    console.log(`Pearson's Correlation: ${coeff.toFixed(4)}`);
    var stress_pearsons = document.getElementById(viz_id+'_pearsons');
    stress_pearsons.textContent = `Pearson's: ${coeff.toFixed(4)}`;
}

function show_spearmans(x, y, viz_id) {
    let coeff = jStat.spearmancoeff(x, y);
    console.log(`Spearman's Correlation: ${coeff.toFixed(4)}`);
    var stress_spearmans = document.getElementById(viz_id+'_spearmans');
    stress_spearmans.textContent = `Spearman's: ${coeff.toFixed(4)}`;
}

function linearRegression(x,y){

    var lr = {};
    var n = y.length;
    var sum_x = 0;
    var sum_y = 0;
    var sum_xy = 0;
    var sum_xx = 0;
    var sum_yy = 0;

    for (var i = 0; i < y.length; i++) {
        sum_x += x[i];
        sum_y += y[i];
        sum_xy += (x[i]*y[i]);
        sum_xx += (x[i]*x[i]);
        sum_yy += (y[i]*y[i]);
    } 

    // Compute slope,intercept and R2 statistic
    lr['slope'] = (n * sum_xy - sum_x * sum_y) / (n*sum_xx - sum_x * sum_x);
    lr['intercept'] = (sum_y - lr.slope * sum_x)/n;
    lr['r2'] = Math.pow((n*sum_xy - sum_x*sum_y)/Math.sqrt((n*sum_xx-sum_x*sum_x)*(n*sum_yy-sum_y*sum_y)),2);
    
    console.log(lr)
    return lr;
};