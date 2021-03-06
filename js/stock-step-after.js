import * as d3 from 'd3';
import { scalepoint, scaleLinear } from 'd3-scale';
import { axisBottom, axisLeft } from 'd3-axis';
import { zoom } from 'd3-zoom';
import "../style.css"

var margin={top:40, right:30, bottom:50, left:70}
var width = $("#stock-step-after").width()-margin.left-margin.right;
var height = 680-margin.left-margin.right;
	
//scale
var x =d3.scalePoint()
		  .domain(["9:30", "10AM", "10:30", "11AM", "11:30", "12AM", "12:30", "1PM","1:30", "2PM","2:30", "3PM","3:30", "4PM"])
		  .range([0, width]);

var xScale = d3.scaleLinear()
    	.range([0, width])
      .domain([9.5, 16.0]);

var yScale = d3.scaleLinear()
		  .range([height, 0])      
      .domain([22.7, 24.0]);
	
var svg = d3.select("#stock-step-after").append("svg")	
		  .attr("width", width+margin.left+margin.right)
		  .attr("height", height+margin.top+margin.bottom)
		  .append("g")
		  .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")")
		  .call(d3.zoom().on("zoom", () => svg.attr("transform", d3.event.transform)
		  ));

// Add the x Axis
svg.append("g")
      .attr("class", "axis")
      .attr("transform",
            "translate(0 ," + (height) + ")")
      .call(d3.axisBottom(x));

svg.append("text")             
      .attr("transform",
            "translate(" + (width/2) + " ," + (height+margin.bottom*3/4) + ")")
      .style("text-anchor", "bottom")
      .text("Time");

// Add the y Axis
svg.append("g")
  		.attr("class", "axis")
      .call(d3.axisLeft(yScale));

svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 -margin.left*0.9 )
      .attr("x", 0 - margin.top)
      .attr("dy", "1em")
      .style("text-anchor", "left")
      .text("Price ($)");      

// Define the div for the tooltip
var tooltip = d3.select("body").append("div") 
      .attr("class", "tooltip")       
      .style("opacity", 0);

var showTooltip = () => {
    tooltip.transition()    
        .duration(200)    
        .style("opacity", .9);
}

var hideTooltip = () => {
    tooltip.transition()    
        .duration(500)    
        .style("opacity", 0);
}

var bidAskContent = (type, price, timeStr) => {
    tooltip.html("<div>Stock " + type + " Price: $" + price + "</div><div>" 
        + type + " Time: " + timeStr + " </div>")
        .style("left", (d3.event.pageX+ 8) + "px")    
        .style("top", (d3.event.pageY - 28) + "px");
}

var tradeContent = (price, shares, tradeType) => {
    tooltip.html ("<div>Stock Price: $" + price + "</div><div>Shares: " 
          + shares + " sh</div><div>Trade Type: " + tradeType + "</div>")
          .style("left", (d3.event.pageX+ 8) + "px")    
          .style("top", (d3.event.pageY - 28) + "px");
}

d3.json("stock.json", (error, data) => {
  if(error) throw error;
	
  //for "ask" and "bid" areas
	var getTime = (timeStr) =>{
	   var timeArr = timeStr.split(":");	
		  return parseInt(timeArr[0])+(parseInt(timeArr[1])+parseInt(timeArr[2])/60)/60;
	};

 	data.bboList.forEach((d) => {
      d.time = getTime(d.timeStr);
      d.bid = + d.bid/10000;
      d.ask = + d.ask/10000;
 	});

// Add the paths with different curves.
    svg.append("path")
      .datum(data.bboList)
      .attr("class", "line1")
      .style("stroke", "#4d2600")
      .attr("d", d3.line()
                   .curve(d3.curveStepAfter)
                   .x(function(d) {return xScale(d.time); })
                   .y(function(d) { return yScale(d.ask); })
               );

svg.append("path")
      .datum(data.bboList)
      .attr("class", "line2")
      .style("stroke", "#003366")
      .attr("d", d3.line()
                   .curve(d3.curveStepAfter)
                   .x(function(d) {return xScale(d.time); })
                   .y(function(d) { return yScale(d.bid); })
               );
  //for "bid" and "ask" tooltips
  var node =svg.selectAll("ellipse")
        .data(data.bboList)
  
  node.enter()
      .append('ellipse')      
      .attr('cx', (d) => xScale(d.time))
      .attr('cy', (d) => yScale(d.bid))
      .attr('rx', 1.8)
      .attr('ry', 1.8)
      .attr('class', 'bid-node')
      .on("mouseover", (d) =>{ 
          showTooltip();   
          bidAskContent("Bid", d.bid , d.timeStr);
      })
      .on("mouseout", (d) => hideTooltip()); 

  node.enter()
      .append('ellipse')      
      .attr('cx', (d) => xScale(d.time))
      .attr('cy', (d) => yScale(d.ask))
      .attr('rx', 1.8)
      .attr('ry', 1.8)
      .attr('class', 'ask-node')
      .on("mouseover", (d) => { 
          showTooltip();  
          bidAskContent("Ask", d.ask, d.timeStr);
      })
      .on("mouseout", (d) => hideTooltip());   	
  
	//for trading circles and tooltips
	var circles =svg.selectAll("circle")
		    .data(data.tradeList)

	circles.enter()
		.append('circle')
		.attr('r', (d) => Math.sqrt(d.shares)/3)
		.attr('cx', (d, i) => xScale(d.time/1000000000/60/60))
		.attr('cy', (d) => yScale(d.price/10000))
		.attr('class', (d) => {
			if(d.tradeType==="E"){
				return "e-node";
			} else {
				return "p-node";
			}
		})
		.on("mouseover", function(d) {		
      showTooltip();	
      tradeContent(d.price/10000, d.shares, d.tradeType);	
      if(d3.select(this).attr("class")=="e-node"){
        $(".p-node").hide();
        
      } else {
        $(".e-node").hide();
      }
    })					
    .on("mouseout", function(d) {		
        hideTooltip();
        $(".p-node").show();
        $(".e-node").show();
    });

});
