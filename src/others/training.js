import React, {useState, useEffect, useRef} from "react";
import "./training.css"
import { Point } from "../classes/Point";
import { extractShapeFeatures} from "./featureExtractor";


function Training({updateValue}) {

    const canvasRef = useRef();
    const contextRef = useRef();
    const [isDrawing, setIsDrawing] = useState(false);

    const [currentPath, setCurrentPath] = useState([]);
    const [center, setCenter] = useState(null);
    const [cornerPoints, setCornerPoints] = useState([]);
    const [radius, setRadius] = useState(null);

    const [label, setLabel] = useState("");
    const [shapes, setShapes] = useState([])
    // Each shape
    // {label: "circle", perimeter: X, area: Y}

    const [areaIndex, setAreaIndex] = useState();
    const [curvatureIndex, setCurvatureIndex] = useState();
    const [deviation, setDeviation] = useState();

    const [circlesData, setCirclesData] = useState([]);
    const [nonCirclesData, setNonCirclesData] = useState([]);


    async function callCircleClassifier(CURVATURE_INDEX, AREA_INDEX, STD_DEVIATION) {

        console.log("Circle Classifier Called")

        const res = await fetch("http://localhost:9000/api/circle-classifier", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                curvatureIndex: CURVATURE_INDEX, 
                areaIndex: AREA_INDEX, 
                deviation: STD_DEVIATION
            })
        })

        const data = await res.json();

        console.log("DATA: ", data.isCircle);

        if(data.isCircle === true) {
            return true;
        }

        return false;
    }

    function addData() {

        if(shapes.length < 1) {
            console.log("No data to add");
            return;
        }

        const body = {
            data: shapes
        }

        fetch("http://localhost:9000/api/add-data", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body),
        }).then((res) => {
            return res.json();
        }).then((val) => {
            console.log(val);

        }).catch((err) => {
            console.log(err);
        })

    }

    function sendData() {

        if(circlesData.length < 1 || nonCirclesData.length < 1) {
            console.log("Not enough data to be send");
            return;
        }

        const data = {
            circles: circlesData.slice(1,),
            nonCircles: nonCirclesData.slice(1,)
        }

        fetch("http://localhost:9000/api/data", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        }).then((res) => {
            return res.json();
        }).then((val) => {
            console.log(val)
        }).catch((err) => {
            console.log("There was some error");
            console.log(err);
        })

        setShapes([]);

    }

    function addShape() {

        if(label === "") {
            alert("Specify a label!");
        }

        const shape = {
            label: label,
            curvatureIndex: curvatureIndex,
            areaIndex: areaIndex,
            deviation: deviation
        }

        setShapes([...shapes, shape]);

        // Once added, empty label and currentPath
        setLabel("");
        setCurrentPath([]);

    }

    function drawPath() {

        if(currentPath.length < 1) return;

        contextRef.current.beginPath();
        contextRef.current.save();
        contextRef.current.globalAlpha = 1;
        const firstPoint = currentPath[0];

        contextRef.current.moveTo(firstPoint.getX(), firstPoint.getY());

        for(let i = 1; i < currentPath.length; i++) {

            const currentPoint = currentPath[i];
            contextRef.current.lineTo(currentPoint.getX(), currentPoint.getY());

        }

        contextRef.current.strokeStyle = "black";
        contextRef.current.strokeWidth = 2;

        contextRef.current.stroke();
        contextRef.current.restore();
        contextRef.current.closePath();

    }

    function drawCornerPoints() {

        
        for(let i = 0; i < cornerPoints.length; i++) {

            const currentPoint = cornerPoints[i];
            contextRef.current.fillStyle = "red";
            contextRef.current.fillRect(currentPoint.getX()-2, 
            currentPoint.getY()-2, 6, 6);
        }
        
    }

    function redraw() {

        contextRef.current.clearRect(0,0,canvasRef.current.width, canvasRef.current.height);

        if(center !== null) {
            contextRef.current.beginPath();
            contextRef.current.arc(center?.getX(), center?.getY(), 2, 0, Math.PI * 2);
            contextRef.current.fillStyle = "red";
            contextRef.current.fill();
            if(radius !== null) {
                // contextRef.current.beginPath();
                // contextRef.current.moveTo(center?.getX(), center?.getY());
                // contextRef.current.lineTo(center?.getX(), center?.getY() - radius);
                // contextRef.current.strokeStyle = "red";
                // contextRef.current.stroke();

                contextRef.current.beginPath();
                contextRef.current.arc(center?.getX(), center?.getY(), radius, 0, Math.PI * 2);
                contextRef.current.strokeWidth = 2;
                contextRef.current.strokeStyle = "black";
                contextRef.current.stroke();
            }
        }
        
        if(cornerPoints.length > 0) {
            drawCornerPoints();
        }
        
        drawPath();
    }


    function startDrawing(e) {

        setIsDrawing(true);
        setRadius(null);

        const rect = canvasRef.current.getBoundingClientRect()

        const xPos = Math.round(e.clientX - rect.left);
        const yPos = Math.round(e.clientY - rect.top);

        const point = new Point(xPos, yPos);

        let temp = [point];

        setCurrentPath(temp);
    }

    async function stopDrawing(e) {

        const rect = canvasRef.current.getBoundingClientRect()

        const xPos = Math.round(e.clientX - rect.left);
        const yPos = Math.round(e.clientY - rect.top);

        const point = new Point(xPos, yPos);
        let temp = [...currentPath];
        temp.push(point);

        setCurrentPath(temp);
        //setCurrentPath([]);

        // fetch("http://localhost:9000/api/linear-regression", {
        //     method: "POST",
        //     headers: {
        //         "Content-Type": "application/json"
        //     },
        //     body: JSON.stringify({
        //         xCoordinates: temp.map((p) => p.getX()),
        //         yCoordinates: temp.map((p) => p.getY())
        //     })
        // }).then((res) => {
        //     return res.json()
        // }).then((value) => {
        //     console.log(value);
        // }).catch((err) => {
        //     console.log(err);
        // })


        const output = extractShapeFeatures(temp);

        if(!output || output.length < 1) {
            return;
        }
        // DRAW CORNER POINTS

        setCornerPoints([...output]);

        setIsDrawing(false);
    }

    function draw(e) {

        if(!isDrawing) return;

        const rect = canvasRef.current.getBoundingClientRect()

        const xPos = Math.round(e.clientX - rect.left);
        const yPos = Math.round(e.clientY - rect.top);

        const point = new Point(xPos, yPos);
        let temp = [...currentPath];
        temp.push(point);

        setCurrentPath(temp);

    }


    useEffect(() => {

        console.log("useEffect");

        const canvas = canvasRef.current

        let dpr = window.devicePixelRatio || 1;

        let rect = canvas.getBoundingClientRect();

        // canvas.width = canvas.offsetWidth
        // canvas.height = canvas.offsetHeight

        
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr; 

        const context = canvas.getContext("2d")

        context.scale(dpr, dpr);
        context.lineWidth = 2
        context.lineCap = "round"   // butt or round or square
        context.lineJoin = "round"  // bevel or milter or round
        context.webkitImageSmoothingEnabled = true;

        contextRef.current = context

    }, [])

    useEffect(() => {

        redraw();

    }, [currentPath, center, cornerPoints])


    return (
        <div>
            <div className="charts-header">
                <span>Charts</span>
                <button onClick={updateValue}>Back</button>
                <button onClick={sendData}>Send</button>
                <button onClick={addData}>Add</button>
            </div>
            <div className="info-section">
                Information
            </div>
            <div className="canvas-section">
                  <div className="canvas-section-top">
                    <p>Shapes Added: {shapes.length}</p>
                    <input value={label}
                    onChange={((e) => setLabel(e.target.value))}
                    placeholder="Label"/>
                    <button onClick={addShape}>
                        Add
                    </button>
                    <button onClick={callCircleClassifier}>
                        Classify
                    </button>
                  </div>
                  <canvas className="charts-canvas"
                  ref={canvasRef}
                  onMouseDown={(e) => startDrawing(e)}
                  onMouseUp={(e) => stopDrawing(e)}
                  onMouseMove={(e) => draw(e)}
                  >
                  </canvas>
            </div>
        </div>

    )
}

export default Training;
