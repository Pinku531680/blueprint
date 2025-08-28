export class LinearRegression {
    constructor() {
        this.m = 0;
        this.b = 0;
    }

    fit(X,Y) {
        // Compute means
        const xMean = this.mean(X);
        const yMean = this.mean(Y);

        // Compute slope m 
        let numerator = 0;
        let denominator = 0;

        for(let i = 0; i < X.length; i++) {
            numerator += (xMean - X[i]) * (yMean - Y[i]);
            denominator += (xMean - X[i]) * (xMean - X[i]);
        }

        if(denominator === 0) {
            this.m = 0;
            return;
        }
        
        // basically m = COV(X,Y) / COV(X)


        this.m = numerator / denominator;
        this.b = yMean - (this.m * xMean);        // b = y - mx
    }

    predict(X) {
        return X.map((x) => {
            const yPredicted = Math.round((this.m * x) + this.b);

            if(isNaN(yPredicted)) {
                console.log("Y PREDICTED IS NAN: ");
                console.log("m, b: ", this.m, this.b);
            }

            return yPredicted;
        });
    }

    mean(nums) {
        return (nums.reduce((acc, val) => acc + val, 0) / nums.length);
    }
}

