
export function eraseSingleUser(e, paths, pageIndex, pages, setPages, removingPath, setRemovingPath, canvasRef) {

    //console.log("Erasing in single user mode");

    let rect = canvasRef.current.getBoundingClientRect();

    // we need to do this to make sure the coordinate of pen
    // gets to right place, if the window is resized
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;

    let x = Math.round((e.clientX - rect.left) * scaleX);
    let y = Math.round((e.clientY - rect.top) * scaleY);

    // Corner points of Eraser SVG
    let corners = [[x-1,y-8], [x-1+20,y-8], [x-1,y+2], [x-1+20,y+2]]

    //contextRef.current.clearRect(x-1,y-8,20,10)
    /*
        a              b
         ______________
        |              |
        |              |
        |______________|
        d              c

    */
    
    const A = corners[0]
    const B = corners[1]
    //const C = corners[2]  // Not Needed
    const D = corners[3]

    const xStart = A[0]
    const xEnd = B[0]
    const yStart = A[1]
    const yEnd = D[1]

    let pathToBeRemovedIndex = null
    let targetPoint = null


    for(let x=0; x < paths.length; x++) {
      let eachPath = paths[x];

      let pointsArr = eachPath.getCategory() === "path" ? eachPath.getPoints() : [];

      // We will check for all the 4 corners of eraser SVG, whether any of those 4 points
      // comes under the bounding box of the text

      if(eachPath.getCategory() === "text") {

        const textCoordinates = eachPath.getTextProps().position;
        const textDimensions = eachPath.getTextProps().dimensions;

        //const textA = [textCoordinates[0], textCoordinates[1] - textDimensions[1]];
        const textA = [textCoordinates[0], textCoordinates[1]];
        // const textB = [textCoordinates[0] + textDimensions[0], textCoordinates[1] - textDimensions[1]];
        const textB = [textCoordinates[0] + textDimensions[0], textCoordinates[1]];
        // const textC = [textCoordinates[0] + textDimensions[0], textCoordinates[1]];
        const textC = [textCoordinates[0] + textDimensions[0], textCoordinates[1] + textDimensions[1]];
        //const textD = [textCoordinates[0], textCoordinates[1]];
        const textD = [textCoordinates[0], textCoordinates[1] + textDimensions[1]];

        const textXStart = textA[0];
        const textXEnd = textB[0];
        const textYStart = textA[1];
        const textYEnd = textD[1];

        for(let y = 0; y < corners.length; y++) {

          // TO check whether any of the 4 corners of eraser is in the bouding box of the text

          let xInRange = corners[y][0] >= textXStart && corners[y][0] <= textXEnd;
          let yInRange = corners[y][1] >= textYStart && corners[y][1] <= textYEnd;

          if(xInRange && yInRange) {

            console.log(`Text with index ${x} in range`);
        
            pathToBeRemovedIndex = x;

            setRemovingPath(true);
            break;
          }
        }
      }

      else if(eachPath.getCategory() === "path") {

        for(let i=0; i < pointsArr.length; i++) {
          let point = pointsArr[i]
  
          let xInRange = point.getX() >= xStart && point.getX() <= xEnd
          let yInRange = point.getY() >= yStart && point.getY() <= yEnd
  
          // If point is in range remove that that
          if(xInRange && yInRange) {

            console.log(`Path with index ${x} in range`);
          
            pathToBeRemovedIndex = x
            targetPoint = [point.getX(), point.getY()]
            setRemovingPath(true)
            break;
          }
        }
      }
      else {
        console.log("ELSE...");
      }
    }

    // After loop, if path/text if found 
    if(pathToBeRemovedIndex !== null) {

      // As we have the index of the path to be removed, we can simply filter that out
      // After that we will modify the state

      let newPaths = paths.filter((path, index) => {
        if(index === pathToBeRemovedIndex) {
          return false;
        } else {
          return true;
        }
      })

      let newPages = pages.map((page, index) => {
        if(index === pageIndex) {
          page = newPaths;
          return page;
        }
        return page;
      })

      console.log("NEW PATHS");
      console.log(newPaths);

      setPages(newPages);

      //updateState(newPaths)
      setRemovingPath(false);

      return {success: true, newPaths: newPaths};
    }

    // else 
    return {success: false};
}


export function eraseMultiUser(contextRef, e, paths, pageIndex, pages, setPages, removingPath, setRemovingPath, canvasRef) {

    let rect = canvasRef.current.getBoundingClientRect();

    // we need to do this to make sure the coordinate of pen
    // gets to right place, if the window is resized
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;

    let x = Math.round((e.clientX - rect.left) * scaleX);
    let y = Math.round((e.clientY - rect.top) * scaleY);

    // Corner points of Eraser SVG
    let corners = [[x-1,y-8], [x-1+20,y-8], [x-1,y+2], [x-1+20,y+2]];

    const A = corners[0]
    const B = corners[1]
    //const C = corners[2]  // Not Needed
    const D = corners[3]

    const xStart = A[0]
    const xEnd = B[0]
    const yStart = A[1]
    const yEnd = D[1]

    let pathToBeRemovedIndex = null;

    // add the comment for what's different in this function from the single user one

    for(let x=0; x < paths.length; x++) {

        const eachPath = paths[x];
        let normalizedPoints = eachPath.getCategory() === "path" ? eachPath.getNormalizedPoints() : [];

        if(eachPath.getCategory() === "text") {

            const actualX = Math.round(eachPath.getTextProps().normalizedPosition[0] * canvasRef.current.width);
            const actualY = Math.round(eachPath.getTextProps().normalizedPosition[1] * canvasRef.current.height);

            const actualWidth = Math.round(eachPath.getTextProps().normalizedDimensions[0] * canvasRef.current.width);
            const actualHeight = Math.round(eachPath.getTextProps().normalizedDimensions[1] * canvasRef.current.height);

            const textCoordinates = [actualX, actualY];
            const textDimensions = [actualWidth, actualHeight];

            // define points A B C D for text, and then check each corner point of eraser
            // whether it falls inside this bounding box of text
            // if that happens, we have to remove the text

            const textA = [textCoordinates[0], textCoordinates[1]];
            const textB = [textCoordinates[0] + textDimensions[0], textCoordinates[1]];
            const textC = [textCoordinates[0] + textDimensions[0], textCoordinates[1] + textDimensions[1]];
            const textD = [textCoordinates[0], textCoordinates[1] + textDimensions[1]];

            const textXStart = textA[0];
            const textXEnd = textB[0];
            const textYStart = textA[1];
            const textYEnd = textD[1];

            // contextRef.current.strokeStyle = "#1097ffff";
            // contextRef.current.lineWidth = 2;

            // contextRef.current.strokeRect(textXStart, textYStart, 
            //   (textXEnd - textXStart), (textYEnd - textYStart));

            for(let y = 0; y < corners.length; y++) {

                // TO check whether any of the 4 corners of eraser is in the bouding box of the text

                let xInRange = corners[y][0] >= textXStart && corners[y][0] <= textXEnd;
                let yInRange = corners[y][1] >= textYStart && corners[y][1] <= textYEnd;

                if(xInRange && yInRange) {

                    console.log(`(Collab) Text with index ${x} in range`);

                    pathToBeRemovedIndex = x;
                    setRemovingPath(true);
                    break;
                }
            }
        }

        else if(eachPath.getCategory() === "path") {
            
            // check each and every point of the path, and see whether its inside the bounding box
            // of the eraser defined using xStart yStart xEnd and yend
            for(let i=0; i < normalizedPoints.length; i++) {

                let normalizedPoint = normalizedPoints[i];

                const actualX = Math.round(normalizedPoint.getX() * canvasRef.current.width);
                const actualY = Math.round(normalizedPoint.getY() * canvasRef.current.height);

        
                let xInRange = actualX >= xStart && actualX <= xEnd;
                let yInRange = actualY >= yStart && actualY <= yEnd;
        
                // If point is in range remove that that
                if(xInRange && yInRange) {

                    console.log(`(Collab) Path with index ${x} in range`);
                
                    pathToBeRemovedIndex = x;
                    setRemovingPath(true)
                    break;
                }
            }
        }
    }


    // After loop, if path/text if found 
    if(pathToBeRemovedIndex !== null) {

        // As we have the index of the path to be removed, we can simply filter that out
        // After that we will modify the state

        let newPaths = paths.filter((path, index) => {
            if(index === pathToBeRemovedIndex) {
                return false;
            } else {
                return true;
            }
        })

        let newPages = pages.map((page, index) => {
            if(index === pageIndex) {
                page = newPaths;
                return page;
            }
            return page;
        })

        console.log("NEW PATHS AFTER ERASE - ");
        console.log(newPaths);

        setPages(newPages);

        //updateState(newPaths)
        setRemovingPath(false)

        return {success: true, newPaths: newPaths};
    }

    // else 
    return {success: false};
}


