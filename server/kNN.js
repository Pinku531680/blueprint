const fs = require("fs");


function euclideanDistance(x1, y1, z1, x2, y2, z2) {

    const A = Math.pow((x2- x1) , 2);
    const B = Math.pow((y2 - y1), 2);
    const C = Math.pow((z2 - z1), 2);

    let d = A + B + C;
    d = Math.sqrt(d).toFixed(2);

    return parseFloat(d);
}

function classifyCircle(curvatureIndex, areaIndex, deviation) {

    console.log("CurvatureIndex: ", curvatureIndex);
    console.log("AreaIndex: ", areaIndex);
    console.log("Deviation: ", deviation);

    // Read JSON file
    let jsonData = fs.readFileSync("data/jsonData.json", {encoding: "utf-8"});
    jsonData = JSON.parse(jsonData);

    let neighbors = [];

    // Find distances between each data point and the given data point
    for(let i = 0; i < jsonData.length; i++) {

        const currentDataPoint = jsonData[i];

        let distance = euclideanDistance(curvatureIndex, areaIndex, deviation,
                                currentDataPoint.curvatureIndex, 
                                currentDataPoint.areaIndex,
                                currentDataPoint.deviation);
        
        neighbors.push({
            label: currentDataPoint.label,
            distance: distance,
        })
    }

    // Sort the neighbors by distance
    let sortedNeighbors = neighbors.sort((a, b) => a.distance - b.distance);

    // Now we return k nearest neighbors from sortedNeighbors
    const k = 7;

    let nearestNeighbors = sortedNeighbors.slice(0, k);
    let nearestCircles = 0;
    let nearestNonCircles = 0;

    for(data of nearestNeighbors) {
        if(data.label === "circle") {
            nearestCircles++;
        }
        else {
            nearestNonCircles++;
        }
    }

    console.log("Nearest Neighbors: ");
    console.log(nearestNeighbors);

    console.log("Nearest Circles: ", nearestCircles);
    console.log("Nearest NonCircles", nearestNonCircles);

    return nearestCircles > nearestNonCircles;
}

module.exports = classifyCircle