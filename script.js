// Set dimensions and margins for the char
const margin = { top: 50, right: 50, bottom: 50, left: 50};
const width = 1200 - margin.left - margin.right;
const height = 800 - margin.top - margin.right;

// Setup the x and y scales
const xScale = d3.scaleTime()
    .range([0, width])

const yScale = d3.scaleLinear()
    .range([height, 0])

// Create SVG element and append it to the chart
const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

    //console.log("Hello, World!");

// create tooltip div
const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip");

// create a second tooltip div for raw date
const tooltipRawDate = d3.select("body")
    .append("div")
    .attr("class", "tooltip");

// create our gradient
const gradient = svg.append("defs")
    .append("linearGradient")
    .attr("id", "gradient")
    .attr("x1", "0%")
    .attr("x2", "0%")
    .attr("y1", "0%")
    .attr("y2", "100%")
    .attr("spreadMethod", "pad")

gradient.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "steelblue")
    .attr("stop-opacity", "1")

gradient.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "steelblue")
    .attr("stop-opacity", "0")



// Load and process data
d3.csv("^BVSP.csv").then(data => {

    console.log(data)

    // Parse the date and convert the "Close" to a number
    const parseDate = d3.timeParse("%Y-%m-%d");
    data.forEach( d => {
        d.Date = parseDate(d.Date);
        d.Close = +d.Close;
    })

    // Set domains for the x and y scales
    xScale.domain(d3.extent(data, d => d.Date));
    yScale.domain([0, d3.max(data, d=> d.Close)]);

    // Add the x-axis
    svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`)
    .style("font-size", "12px")
    .call(d3.axisBottom(xScale)
        .tickValues(xScale.ticks(d3.timeYear.every(1)))
        .tickFormat(d3.timeFormat("%Y")))
    .selectAll(".tick line")
    .style("stroke-opacity", 1);

    svg.selectAll(".tick text")
        .attr("fill", "#888");

    // Add the y-axis

    svg.append("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${width}, 0)`)
        .style("font-size", "12px")
        .call(d3.axisRight(yScale)
            .ticks(10)
            .tickFormat(d => {
                if(isNaN(d)) return "";
                return `${d.toFixed(0)}`;
            })
        )
        .selectAll(".tick line")
        .style("stroke-opacity", 1);

    svg.selectAll(".tick text")
        .style("fill", "#888");


    // Setup the line generator
    const line = d3.line()
        .x(d => xScale(d.Date))
        .y(d => yScale(d.Close));

    // Create an area generator
    const area = d3.area()
        .x(d => xScale(d.Date))
        .y0(height)
        .y1(d => yScale(d.Close))


    // Add the area path
    svg.append("path")
        .datum(data)
        .attr("class", "area")
        .attr("d", area)
        .style("fill", "url(#gradient)")
        .style("opacity", 0.5)


    // Add the line path
    svg.append("path")
        .datum(data)
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1)
        .attr("d", line)

    // Add a circle element
    const circle = svg.append("circle")
        .attr("r", 0)
        .attr("fill", "springgreen")
        .attr("opacity", 0.75)
        .style("stroke", "green")
        .style("pointer-events", "none")

    // Add red lines extending from the circle to the date and value

    const tooltipLineX = svg.append("line")
            .attr("class", "tooltip-line")
            .attr("id", "tooltip-line-x")
            .attr("stroke", "green")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "2,2");

    const tooltipLineY = svg.append("line")
        .attr("class", "tooltip-line")
        .attr("id", "tooltip-line-y")
        .attr("stroke", "green")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "2,2");

    // create a listening rectangle
    const listeningRect = svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("opacity", 0);

    // create the mouse move function
    listeningRect.on("mousemove", function (event){
        const[xCoord] = d3.pointer(event, this);
        const bisectDate = d3.bisector(d => d.Date).left;
        const x0 = xScale.invert(xCoord);
        const i = bisectDate(data, x0, 1);
        const d0 = data[i - 1];
        const d1 = data[i];
        const d = x0 - d0.Date > d1.Date - x0 ? d1 : d0
        const xPos = xScale(d.Date);
        const yPos = yScale(d.Close);
    
        
        // Update the circle position
        circle.attr("cx", xPos).attr("cy", yPos);

        // Add transition for the circle radius
        circle.transition()
            .duration(50)
            .attr("r", 5)

        // Update the position of the red lines
        tooltipLineX.style("display", "block").attr("x1", xPos).attr("x2", xPos).attr("y1", yPos).attr("y2", height);
        tooltipLineY.style("display", "block").attr("y1", yPos).attr("y2", yPos).attr("x1", xPos).attr("x2", width);


        // Add in tooltips
        tooltip
            .style("display", "block")
            .style("left", `${width + 59}px`)
            .style("top", `${yPos + 45}px`)
            .html(`${d.Close !== undefined ? d.Close.toFixed(0) : 'N/A'}`);

        tooltipRawDate
            .style("display", "block")
            .style("left", `${xPos + 18}px`)
            .style("top", `${height + 59}px`)
            .html(`${d.Close !== undefined ? d.Date.toISOString().slice(0, 10) : 'N/A'}`);

        // listening rectangle mouse leave function
        listeningRect.on("mouseleave", function () {
                circle.transition().duration(50).attr("r", 0)
                tooltip.style("display", "none");
                tooltipRawDate.style("display", "none")
                tooltipLineX.attr("x1", 0).attr("x2", 0);
                tooltipLineY.attr("y1", 0).attr("y2", 0);
                tooltipLineX.style("display", "none");
                tooltipLineY.style("display", "none");
        });

    })

    // Define the Slider
    const sliderRange = d3
    .sliderBottom()
    .min(d3.min(data, d => d.Date))
    .max(d3.max(data, d => d.Date))
    .width(300)
    .tickFormat(d3.timeFormat('%Y-%m-%d'))
    .ticks(3)
    .default([d3.min(data, d => d.Date), d3.max(data, d => d.Date)])
    .fill("steelblue");

    sliderRange.on('onchange', val => {
    // Set new domain for x scale
    xScale.domain(val)

    // Filter data based on slider values
    const filteredData = data.filter(d => d.Date >= val[0] && d.Date <= val[1])

    // Update the line area to new domain
    svg.select(".line").attr("d", line(filteredData));
    svg.select(".area").attr("d", area(filteredData));

    // Set new domain for the y scale based on new data
    yScale.domain([0, d3.max(filteredData, d => d.Close)]);

    // Update the x-axis with the new domain
    svg.select(".x-axis")
        .transition()
        .duration(300)
        .call(d3.axisBottom(xScale)
            .tickValues(xScale.ticks(d3.timeYear.every(1)))
            .tickFormat(d3.timeFormat("%Y")));

    // Update the y-axis with the new domain

    svg.select(".y-axis")
        .transition()
        .duration(300)
        .call(d3.axisRight(yScale)
        .ticks(10)
        .tickFormat(d => {
            if (d <= 0) return "";
            return `${d.toFixed(0)}`;
        }));

    });

    // Add slider to the DOM
    const gRange = d3
    .select("#slider")
    .append("svg")
    .attr("width", 500)
    .attr("height", 100)
    .append("g")
    .attr("transform", 'translate(60,30)')

    gRange.call(sliderRange);

    // Add chart Title
    svg.append("text")
        .attr("x", 0)
        .attr("y", 0)
        .style("font-family", "sans-serif")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("^BVSP - Dados Históricos do Índice Bovespa");

    // Add the source Credit
    svg.append("text")
        .attr("x", width - 86)
        .attr("y", height + 40)
        .style("text-anchor", "left")
        .style("font-family", "sans-serif")
        .style("font-size", "8px")
        .style("font-weight", "bold")
        .style("text-decoration", "underline")
        .html("<a href='https://finance.yahoo.com/quote/%5EBVSP/'>Fonte: Yahoo Finance</a>");



});