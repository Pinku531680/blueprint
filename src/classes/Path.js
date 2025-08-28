import { Point } from "./Point";

export class Path {

    id;
    category = "path";
    points = [];
    type;
    color;
    size;
    opacity;

    // normalizedPoints is added if user is in collaboration mode

    
    textProps = {
        position: [],        // x and y coordinates
        dimensions: [],     // width and height
        text: null,
        fontSize: 0,
        fontColor: null,
        font: null
    }

    // additional keys are added in textProps if user is in collaboration mode
    // normalized position, dimensions, and fontSize

    shapeProps = {
        position: [],
        shape: null,
        width: 0,
        height: 0,
        shapeColor: null
    }

    lineProps = {
        startPosition: [],
        endPosition: [],
        lineColor: null,
        lineSize: null
    }

    constructor(id, type, points, color, size, opacity, category, textProps, shapeProps, 
        lineProps, isBroadcasted = false, normalizedPoints = []) {

        this.id = id;
        this.type = type;          // regular, dashed, dotted (only for freehand paths and straight lines)
        this.points = points;      // An array of Point class instances
        this.color = color;     
        this.size = size;              // Thickness if regular path
        this.opacity = opacity;        // only for freely drawn paths
        this.category = category;      // "path", "text", "shape" or "line" ("path" is default)
        this.textProps = textProps;    // For text only
        this.shapeProps = shapeProps;  // For shapes onlye
        this.lineProps = lineProps;    // For lines only

        // Only in collaboration mode
        this.isBroadcasted = isBroadcasted;
        // this is just a boolean flag which will be used only if the user is in collboration mode
        // this decides whether a path will be drawn using the "points" array or the "normalizedPoints" arr
        // if this is true, the drawPath function uses normalizedPoints to draw

        this.normalizedPoints = normalizedPoints;   
        // in single user mode, this normalizedPoints array will be empty
        // but in collaboration mode, the other users will use these coordinates to draw on their board
    }


    // function to form Path instances from plain objects with same values
    static fromObject(obj) {
        //console.log("FROM OBJECT CALLED");
        // we need to convert point objects to Point instances as well
        // but for "text" obj.points might be null
        let points = null;
        if(obj.points !== null) {
            points = obj.points.map((p) => new Point(p.x, p.y));
        }

        let normalizedPoints = null;
        if(obj.normalizedPoints !== null && obj.normalizedPoints.length > 0) {
            normalizedPoints = obj.normalizedPoints.map((p) => new Point(p.x, p.y));
        }


        const output = new Path(obj.id, obj.type, points, obj.color, 
            obj.size, obj.opacity, obj.category, obj.textProps, obj.shapeProps, 
            obj.lineProps, obj.isBroadcasted, normalizedPoints);

        // console.log("RETURNING FROM fromObject()");
        // console.log(output);

        return output;
    }

    // This method is used when creating a deep copy of array containing paths
    getValues() {
        return [
            this.id,
            this.type,
            this.points,
            this.color,
            this.size,
            this.category,
            this.textProps,
            this.shapeProps,
            this.lineProps
        ]
    }

    getTextProps() {
        return this.textProps;
    }

    getShapeProps() {
        return this.shapeProps;
    }

    getLineProps() {
        return this.lineProps;
    }

    getCategory() {
        return this.category;
    }

    getColor() {
        return this.color;
    }

    getSize() {
        return this.size;
    }

    getType() {
        return this.type;
    }

    getOpacity() {
        return this.opacity;
    }

    getId() {
        return this.id;
    }

    getPoints() {
        return this.points;
    }

    getNormalizedPoints() {
        return this.normalizedPoints;
    }

    addPoint(point) {
        this.points.push(point);
    }

    addNormalizedPoint(point) {
        this.normalizedPoints.push(point);
    }

}

