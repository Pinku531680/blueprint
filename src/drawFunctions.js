export function drawPath(eachPath, contextRef) {

    contextRef.current.beginPath()

    //contextRef.current.setLineDash([5,5])  -->  FOR DASHED LINES

    let firstPoint = eachPath.points[0];
    contextRef.current.moveTo(firstPoint.getX(), firstPoint.getY());

    for(let i=0; i < eachPath.getPoints().length; i++) {
      
      let nextPoint = eachPath.getPoints()[i];
      contextRef.current.lineTo(nextPoint.getX(), nextPoint.getY());

    }

    contextRef.current.strokeStyle = eachPath.getColor();
    contextRef.current.lineWidth = eachPath.getSize();
    contextRef.current.stroke()

}

export function drawPaths(paths, contextRef) {
    if(paths.length > 0){

        for(const path of paths) {
            drawPath(path);
        }

    }
}

