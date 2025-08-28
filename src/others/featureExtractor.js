import { LinearRegression } from "./linearRegression";
import { Point } from "../classes/Point";

// Features for all the shapes(except lines) will be extracted in the same manner

export function detectLine(points) {

    console.log("Points Length: ", points.length);

    if(points.length < 10) {
        console.log("Small path");
        return false;
    }

    console.log("Line Detection");

    // Divides the points array into chunks of 15 points each
    // Find the theta between the line of 15 points and the X-axis
    // Check whether all the theta angles are almost similar
    // If similar, then the line is straight otherwise it's not

    const eachPartLength = 8;
    const numberOfParts = Math.floor(points.length / eachPartLength);

    let angles = [];

    for(let x = 0; x < numberOfParts; x++) {

        let startIndex = x * eachPartLength;
        let endIndex = (x+1) * eachPartLength;

        const part = points.slice(startIndex, endIndex);

        const initialPoint = part.at(0);
        const finalPoint = part.at(-1);

        const numerator = Math.abs(finalPoint.getY() - initialPoint.getY());
        const denominator = Math.abs(finalPoint.getX() - initialPoint.getX());

        const ratio = numerator / denominator;

        const angle = Math.ceil(Math.atan(ratio) * (180 / Math.PI));

        angles.push(angle);

    }

    const valPerAngle = Math.floor(100 / (numberOfParts-1));
    let totalValue = 0;    // 0 - 100

    for(let i = 1; i < angles.length; i++) {

        const angleDiff = Math.abs(angles[i] - angles[i-1]);
        
        if(angleDiff <= 5) {

            totalValue += 1 * valPerAngle;
        }
        else if(angleDiff <= 10) {

            totalValue += 0.8 * valPerAngle;
        }
        else if(angleDiff <= 15) {
            
            totalValue += 0.6 * valPerAngle;
        }
        else if(angleDiff <= 20) {

            totalValue += 0.4 * valPerAngle;
        }
        else if(angleDiff > 20) {

            totalValue += 0 * valPerAngle;
        }
        else if(angleDiff > 50) {

            totalValue -= 0.2 * valPerAngle;
        }
        else if(angleDiff > 75) {

            totalValue -= 0.6 * valPerAngle;
        }
        else {
            console.log("ELSE");
        }

    }

    totalValue = Math.ceil(totalValue);

    // console.log("Angles: ", angles);
    // console.log("Total Value: ", totalValue);

    const initialPoint = points.at(0);
    const finalPoint = points.at(-1);

    const num = Math.abs(finalPoint.getY() - initialPoint.getY());
    const den = Math.abs(finalPoint.getX() - initialPoint.getX());
    const r = num / den;

    let angleBetweenInitialAndFinal = Math.atan(r) * (180 / Math.PI);
    angleBetweenInitialAndFinal = angleBetweenInitialAndFinal.toFixed(2);


    // console.log("Theta: " , angleBetweenInitialAndFinal);
    // console.log("Initial: ", initialPoint);
    // console.log("Final: ", finalPoint);

    // To find the next point on this straight line, we will add 1 to the X coordinate
    // and to get the Y coordinate we will multiple 1 by the slope

    if(totalValue >= 80) {
        return true;
    }


    return false;
}



function filterDuplicatePoints(points) {

    let temp = [];
    
    for(let i = 0; i < points.length; i++) {

        const currentPoint = points[i];

        const isDuplicate = temp.find((point, index) => {
            let condition = point.getX() === currentPoint.getX() &&
                            point.getY() === currentPoint.getY()
            return condition;
        })

        if(!isDuplicate) {
            temp.push(currentPoint);
        } else {
            continue;
        }

    }

    return temp;
}


export function estimateRadius(points) {

    const circumference = findPerimeter(points);
    const radius = Math.floor(circumference / (2*Math.PI));

    return radius;
}

function computeShapeWidth(points) {

    // We compute the left and right extreme points of the shape
    // then take the magnitude of difference between X coordinates
    let leftMostPoint = points[0];
    let rightMostPoint = points[0];

    for(let i = 1; i < points.length; i++) {

        const currentPoint = points[i];

        if(currentPoint.getX() < leftMostPoint.getX()) {
            leftMostPoint = currentPoint;
        }

        if(currentPoint.getX() > rightMostPoint.getX()) {
            rightMostPoint = currentPoint;
        }
    }

    const width = Math.abs(rightMostPoint.getX() - leftMostPoint.getX());

    return width;
}

function computeShapeHeight(points) {

    // We compute the top and bottom extreme points
    // then take the magnitude of difference between Y coordinates

    let topMostPoint = points[0];
    let bottomMostPoint = points[0];

    for(let i = 1; i < points.length; i++) {

        const currentPoint = points[i];

        if(currentPoint.getY() < topMostPoint.getY()) {
            topMostPoint = currentPoint;
        }

        if(currentPoint.getY() > bottomMostPoint.getY()) {
            bottomMostPoint = currentPoint;
        }
    }

    const height = Math.abs(bottomMostPoint.getY() - topMostPoint.getY());

    return height;
}

function findDimensions(topMostPoint, bottomMostPoint, leftMostPoint, rightMostPoint) {

    // We find the perpendicular distances between the topMost and bottomMost point
    // and between the rightMost and leftMost point
    const height = Math.abs(topMostPoint.getY() - bottomMostPoint.getY());
    const width = Math.abs(leftMostPoint.getX() - rightMostPoint.getX());

    return {height, width};
}

function estimateCenter(points) {

    // We first compute our 4 extreme points

    let topMostPoint = points[0];
    let bottomMostPoint = points[0];
    let leftMostPoint = points[0];
    let rightMostPoint = points[0];

    for(let i = 1; i < points.length; i++) {

        const currentPoint = points[i];

        if(currentPoint.getX() < leftMostPoint.getX()) {
            leftMostPoint = currentPoint;
        }
        else if(currentPoint.getX() > rightMostPoint.getX()) {
            rightMostPoint = currentPoint;
        }
        else if(currentPoint.getY() < topMostPoint.getY()) {
            topMostPoint = currentPoint;
        }
        else if(currentPoint.getY() > bottomMostPoint.getY()) {
            bottomMostPoint = currentPoint;
        }
        else {
            continue;
        }
    }

    // After having the 4 extreme points, we take averages of X and Y coordinates
    // to estimate the center point

    const cornerPoints = [topMostPoint, bottomMostPoint, leftMostPoint, rightMostPoint];
    const xAvg = cornerPoints.reduce((acc, val) => acc + val.getX(), 0) / 4;
    const yAvg = cornerPoints.reduce((acc, val) => acc + val.getY(), 0) / 4;
    const estimatedCenterPoint = new Point(Math.round(xAvg), Math.round(yAvg));

    console.log("CENTER: ", estimatedCenterPoint);

    return estimatedCenterPoint;
}

function euclideanDistance(A, B) {

    const a = Math.pow((B.getX() - A.getX()), 2);
    const b = Math.pow((B.getY() - A.getY()), 2);

    const output = Math.sqrt(a + b);

    return parseFloat(output.toFixed(2));

}

function findPerimeter(points) {

    let perimeter = 0;

    for(let i = 0; i < points.length - 1; i++) {

        const nextIndex = (i+1);
        perimeter += euclideanDistance(points[i], points[nextIndex]);
    }

    perimeter = Math.round(perimeter);

    return perimeter;
}

function triangleArea(A, B, C) {

    const a = euclideanDistance(B, C);
    const b = euclideanDistance(A, C);
    const c = euclideanDistance(A, B);

    let S = ((a+b+c) / 2);

    const x = Math.abs(S-a);
    const y = Math.abs(S-b);
    const z = Math.abs(S-c);

    let temp = (S*x*y*z);
    const area = Math.sqrt(temp);

    if(isNaN(area)) {
        console.log("TRIANGLE AREA IS NaN");
    }

    return area;
}

function findAreaOld(points) {

    let area = 0;
    const A = points[0];

    for(let i = 1; i < points.length - 1; i++) {

        const B = points[i];
        const C = points[i+1];
        area += triangleArea(A,B,C);
    }

    area = Math.round(area);
    return area;
}

function findArea(points) {

    let area = 0;
    const A = estimateCenter(points);

    for(let i = 0; i < points.length-1; i++) {

        const B = points[i];
        const C = points[i + 1];
        area += triangleArea(A,B,C);
    }

    area = Math.round(area);
    return area;
}


function computeCircularity(points) {

    const actualArea = findArea(points);
    const perimeter = findPerimeter(points);

    const circularity = parseFloat(((4*Math.PI*actualArea)/(perimeter*perimeter)).toFixed(2));

    return circularity;
}

function computeDeviation(points) {
    // First, we fit our Linear Regression model with the data 
    // then we predict all the Y values based on the line fitted
    // We compute the residual which is |yPredicted - yActual|
    // Then we compute standard deviation on these values
    // |yResidual - meanResidual|
    const xActual = points.map((point) => point.getX());
    const yActual = points.map((point) => point.getY());

    const linearRegression = new LinearRegression();
    linearRegression.fit(xActual, yActual);

    const yPredicted = linearRegression.predict(xActual);
    const yResidual = yPredicted.map((y, i) => Math.abs((y - yActual[i])));
    const meanResidual = Math.round(yResidual.reduce((acc, val) => acc + val, 0) / points.length);
    
    let variance = 0;

    for(let i = 0; i < points.length; i++) {

        variance += (yResidual[i] - meanResidual)*(yResidual[i] - meanResidual);
    }

    variance = variance / points.length; // divide by N
    let stdDeviation = Math.sqrt(variance);
    stdDeviation = parseFloat(stdDeviation.toFixed(2));

    if(isNaN(stdDeviation)) {
        console.log("STD DEV IS NAN");
        console.log("Variance: ", variance);
        console.log("yResidual: ", yResidual);
        console.log("meanResidual: ", meanResidual);
        console.log("yPredicted: ", yPredicted);
    }

    return parseFloat(variance.toFixed(2));
}

function computeAngles(points) {

    // Call computeDeviation() function only for 5 points at a time
    const N = 6;
    let angles = [];
    const filteredPoints = points.slice(0, (Math.floor(points.length/N)*N) + 1);

    for(let i = 0; i <= (filteredPoints.length - N); i+= N/2 ) {

        const currentSlice = filteredPoints.slice(i, i + N);
        const firstPoint = currentSlice[0];
        const lastPoint = currentSlice[N-1];
        const n = Math.abs(Math.abs(lastPoint.getY()) - Math.abs(firstPoint.getY()));
        const d = Math.abs(Math.abs(lastPoint.getX()) - Math.abs(firstPoint.getX()));
        const angle = d === 0 ? 90 : parseFloat(((180 / Math.PI) * Math.atan(n/d)).toFixed(2));

        angles.push(angle);
    }

    return angles;
}

function detectCorners(points) {

    const angles = computeAngles(points);
    let deviations = 0;
    let lastDeviationIndex = 0;
    let deviationIndices = [];
    let precedingAverages = [];

    for(let i = 1; i < angles.length; i++) {

        const N = (i - lastDeviationIndex);
        const currentValue = angles[i];
        const precedingAvg = angles.slice(lastDeviationIndex, i)
                            .reduce((acc, val) => acc + val, 0) / N;
                                                
        // To detect corners, we will make sure that the currentValue of angles
        // is more than (or less than) 1.7 times of the average values before it
        // Also, we will make sure that consecutive points are not called as corners
        // which means that we will have only one corner for a set of points

        const difference = Math.round(Math.abs(precedingAvg - currentValue));

        if(difference > (0.6 * precedingAvg) && ((i - lastDeviationIndex) > 5)) {
            // There is a deviation
            deviations++;
            lastDeviationIndex = i;
            deviationIndices.push(i);
            precedingAverages.push(precedingAvg);
        }                            
    }

    console.log("CORNERS: ", deviations);
    console.log("DEVIATION INDICES: ", deviationIndices);
    console.log("ANGLES: ", angles);
    
    return deviationIndices;
}


function findDeviation(points, centerPoint) {
    // First compute the mean distance, then compute the variance
    // At last compute the Standard Deviation using the variance

    let meanDistance = 0;

    for(let x = 0; x < points.length; x++) {

        const a = euclideanDistance(points[x], centerPoint);
        meanDistance += a;
    }

    meanDistance = Math.round(Math.round(meanDistance) / points.length);

    let differencesSum = 0;

    for(let i = 0; i < points.length; i++) {
        let d = euclideanDistance(points[i], centerPoint) - meanDistance;
        d = parseFloat(Math.pow(d, 2).toFixed(2));
        differencesSum += d;
    }

    const variance = Math.round(differencesSum / points.length);
    const stdDev = parseFloat(Math.sqrt(variance).toFixed(2));

    console.log("STD DEV: ", stdDev);
    return stdDev;
}

 export function extractShapeFeatures(points) {

    if(points.length < 15) {
        return false;
    }

    const circularAreaRatio = computeCircularity(points);
    const computedArea = findArea(points)
    const perimeter = findPerimeter(points);
    const deviationIndices = detectCorners(points);

    const N = 6;
    const filteredPoints = points.slice(0, (Math.floor(points.length/N)*N) + 1);
    let deviationPointIndices = deviationIndices.map((index) => index * (N/2));
    let deviationPoints = [];

    filteredPoints.forEach((point, index) => {
        if(deviationPointIndices.includes(index)) {
            deviationPoints.push(point);
        }
    })

    console.log("-".repeat(20));
    console.log("POINTS: ", points.length)
    console.log("CIRCULARITY: ", circularAreaRatio);
    console.log("COMPUTED AREA: ", computedArea);
    console.log("DEVIATION POINTS", deviationPoints);
    // console.log("SHAPE WIDTH: ", computeShapeWidth(points));
    // console.log("SHAPE HEIGHT: ", computeShapeHeight(points));
    console.log("-".repeat(20));

    return deviationPoints;
 }

