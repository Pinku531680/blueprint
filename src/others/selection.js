export function pathSelection(clickCoordinates, paths) {

    

    // FOR TEXT - we can focus on the bouding box, if mouse clikc is present inside the
    // bounding box, then we can select that text

    // SELECTING TEXT IS PRIOR THAN SELECTING PATHS

    // FOR PATHS - compute the distances of each point in path from mouse click coordinate
    // if at any stage, the distance is less than 3 units, SELECT THAT PATH
    // basically, we compute distances of each point of path from mouse click to find the
    // SHORTEST DISTANCE between the path and mouse click, if that DISTANCE is less than 3
    // units, we select that path and don't care about other paths

    // ONLY FOR category = "text"
    let targetText;

    for(let k = 0; k < paths.length; k++) {

        const path = paths[k];

        if(path.getCategory() !== "text") continue;

        // check if mouse click is inside bounding box of this text
        // we have topLeft coordinates of text, and width, height

        const textCoords = {
            x: path.getTextProps().position[0],
            y: path.getTextProps().position[1]
        }

        const textDimensions = {
            width: path.getTextProps().dimensions[0],
            height: path.getTextProps().dimensions[1]
        }

        // coordinates of mouse click
        const X = clickCoordinates.x;
        const Y = clickCoordinates.y;

        let xCondition = (X >= textCoords.x) && (X <= (textCoords.x + textDimensions.width));
        let yCondition = (Y >= textCoords.y) && (Y <= (textCoords.y + textDimensions.height));

        // console.log("-".repeat(15));
        // console.log(path.getTextProps());
        // console.log("CLICK - ", clickCoordinates);
        // console.log("textCoords: ", textCoords);
        // console.log("textDimensions: ", textDimensions);
        // console.log("xCondition: ", xCondition);
        // console.log("yCondition: ", yCondition);
        // console.log("-".repeat(15));

    
        if(xCondition && yCondition) {
            targetText = path;
            break;
        }

    }

    
    if(targetText !== undefined) {
        return targetText;
    }

    
    let minDistances = new Array(paths.length);

    let targetPath;

    for(let k = 0; k < paths.length; k++) {

        // just for paths not text
        if(paths[k].getCategory() !=="path") continue;

        const points = paths[k].getPoints();

        for(let l = 0; l < points.length; l++) {

            const p = points[l];

            let A = Math.pow((clickCoordinates.x - p.getX()), 2);
            let B = Math.pow((clickCoordinates.y - p.getY()), 2);

            let DIST = parseFloat(Math.sqrt(A + B).toFixed(2));

            if(minDistances[k] === undefined || minDistances[k] > DIST) {
                minDistances[k] = DIST;
            }
        }

        // after checking distances of all points of this path,
        // the first path to have distance of less than 3 units from mouse click
        // will be selectedd.

        if(minDistances[k] <= 4) {
            targetPath = paths[k];
            break;
        }
    }    

    // console.log("MIN DISTANCES - ");
    // console.log(minDistances);

    if(targetPath !== undefined) {
        return targetPath;
    }

    return undefined;
}

