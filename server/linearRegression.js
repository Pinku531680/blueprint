function linearRegression(xCoordinates, yCoordinates) {

    if(xCoordinates.length !== yCoordinates.length) {
        console.log("Length of X and Y is different.");
        return;
    }

    const N = xCoordinates.length;

    let m;  // slope
    let b;  // constant
    let numerator;
    let denominator;

    let xMean = xCoordinates.reduce((acc, val) => acc + val, 0) / N;
    let yMean = yCoordinates.reduce((acc, val) => acc + val, 0) / N;

    return [xMean, yMean];
}


module.exports = linearRegression;

