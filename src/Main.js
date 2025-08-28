import React, {useState, useEffect, useRef} from "react"
import "./App.css"
import { Point } from "./classes/Point"
import { Path } from "./classes/Path"
import { PageState } from "./classes/pageState"
import Tools from "./Tools"
import PenToolSelected from "./PenToolSelected"
import TextToolSelected from "./TextToolSelected"
import EraserToolSelected from "./EraserToolSelected"
import PageTypeToolSelected from "./PageTypeToolSelected"
import CollaborateModal from "./collaborateModal"
import ParticipantsModal from "./participantsModal"
import ConfirmationDialog from "./confirmationDialog"
import { eraseMultiUser, eraseSingleUser } from "./eraseFunctions"
import UserDisabled from "./UserDisabled"



function Main() {

  // for collaboration mode
  const ws = useRef(null);
  const url = "localhost:9000";
  const backendURL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
  const wsURL = process.env.WS_URL = process.env.REACT_APP_WS_URL || "ws://localhost:8000";

  const [createLoading, setCreateLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  // for loading spinner, when creating room or joining room

  // page view - home or room
  const [pageView, setPageView] = useState("home");
  const pageViewRef = useRef("home");

  // for username and roomId inputs
  const [userName, setUserName] = useState("");
  const [roomId, setRoomId] = useState("");

  const [currentRoomData, setCurrentRoomData] = useState({
    roomId: null, users: [], admin: null
  });

  const [boardLock, setBoardLock] = useState({
    userName: null,
    mode: null,
    lastInteractionTime: null,
    isFocused: false
  })

  const [boardLockAvailable, setBoardLockAvailable] = useState(false);
  // this changes if lock is aquired after requesting

  const [currentUserData, setCurrentUserData] = useState({
    ws: null, userName: null, isAdmin: false, isDisabled: false
  });

  const userIsAdmin = useRef(false);

  
  const currentRoomDataRef = useRef(currentRoomData);
  const [collaborateError, setCollaborateError] = useState("");

  // modal releated refs
  const collaborateModalRef = useRef();
  const participantsModalRef = useRef();
  const confirmationDialogRef = useRef();

  // message that confirmation dialog shows
  const [confirmationDialogMessage, setConfirmationDialogMessage] = useState("");
  const [confirmationDialogUserName, setConfirmationDialogUserName] = useState("");
  const [confirmationDialogType, setConfirmationDialogType] = useState("")
  // the type of action for which the confirmation dialog is 

  // state to store the temp text data while the user in control is adding some text
  const [tempTextData, setTempTextData] = useState({
    text: null, font: null, normalizedFontSize: null, normalizedCoordinates: {x: null, y: null},
    fontColor: null
  });



  const [selectedTool, setSelectedTool] = useState("pen")  // default - pen tool
  // others are - text, page-type, shape-detection, eraser

  // FOR PEN TOOL
  const [selectedColor, setSelectedColor] = useState("#121212")
  // Initial size - 3
  const [selectedSize, setSelectedSize] = useState(3)   
  // Initial opacity - 1 
  const [selectedOpacity, setSelectedOpacity] = useState(1.0);
  const [selectedType, setSelectedType] = useState("regular")


  // For PAGE TYPE TOOL
  const [pageType, setPageType] = useState("plain");  // plain or ruled
  const [ruleColor, setRuleColor] = useState("#121212");
  const [ruleHeight, setRuleHeight] = useState(20);  // size in pixels


  // For text
  const [text, setText] = useState("Text");   // default - "Text"
  const [fontSize, setFontSize] = useState(28);     // default 28 
  // Min - 14, Max - 60, Default - 28
  const validFontSizes = [14, 20, 24, 28, 34, 38, 42, 48, 60];
  const [fontColor, setFontColor] = useState("#121212")
  const [font, setFont] = useState("Poppins"); // default font is Poppins
  const [isTextPositionSelected, setIsTextPositionSelected] = useState(false)
  const [isAddingText, setIsAddingText] = useState(false)
  // this above value will be true when we have opened the text tool and
  // adding text currently

  const [textCoordinates, setTextCoordinates] = useState({
      x: 0, y: 0
  })

  const [textDimensions, setTextDimensions] = useState({
    width: 0, height: 0
  })


  const canvasRef = useRef(null)
  const contextRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [removingPath, setRemovingPath] = useState(false)


  // Array of Path class instances
  const [paths, setPaths] = useState([]);

  //const [paths, setPaths] = useState(new Paths([]));

  // This variable stores various states of the page
  // Will be used for undo and redo functionality
  const [states, setStates] = useState([ ])
  // states is an array of PageState objects that store the path data
  // the updateState function handles the logic of adding a new PageState

  // Pages consists of many paths which in themselves consist of many individual Path instance variables
  const [pages, setPages] = useState([])  // Array of arrays of paths
  // the useEffect at bottom inserts an ampty array inside this state
  // before doing anything else
  // and as pageIndex = 0 initially, pages[pageIndex] refers to that empty array

  let [pageIndex, setPageIndex] = useState(0)

  const pagesRef = useRef([]);

  
  // Related to Tools component

  const toolsHandler = {

    toolSelect: (tool) => {

      // it might be the case that user is adding some text
      // and then selects some other tool
      // in that case, we want to prevent this if the text has not been
      // added completely
      if(isAddingText && isTextPositionSelected) {
        // don't allow to select other tool when text is being added
        // but has not been added
        return;
      }

      console.log("Selected: ", tool);
      setSelectedTool(tool);
    },

    colorSelect: (color) => {
      console.log("HEX: ", color);
      setSelectedColor(color);
    },

    sizeSelect: (newSize) => {
      setSelectedSize(newSize);
    },

    typeSelect: (newType) => {

      switch(newType) {
        case "regular":
          setSelectedType("regular")
          break;
        case "dashed":
          setSelectedType("dashed");
          break;
        case "dotted":
          setSelectedType("dotted");
          break;
        default:
          setSelectedType("regular");
          break;
      }

    },

    opacitySelect: (newOpacity) => {
      // during addition and subtraction of "0.1", we might have decimal
      // numbers with many many decimal places
      const x = newOpacity.toFixed(1);

      console.log("Opacity: ", newOpacity);
      setSelectedOpacity(parseFloat(x));
    },

    pageTypeSelect: (newPageType) => {
      setPageType(newPageType);

      // if in room, broadcast updated page type, rule color and rule height
      // to all in the room
      if(pageView === "room") {
        updatePageType(newPageType, ruleColor, ruleHeight);
      }
    },

    ruleColorSelect: (newRuleColor) => {
      // newRuleColor is in HEX form
      setRuleColor(newRuleColor);

      // if in room, broadcast updated page type, rule color and rule height
      // to all in the room
      if(pageView === "room") {
        updatePageType(pageType, newRuleColor, ruleHeight);
      }
    },

    ruleHeightSelect: (newRuleHeight) => {
      // newRuleHeight must be an integer
      setRuleHeight(newRuleHeight);

      // if in room, broadcast updated page type, rule color and rule height
      // to all in the room
      if(pageView === "room") {
        updatePageType(pageType, ruleColor, newRuleHeight);
      }
      
    },

    textSelect: (newText) => {
      setText(newText);

      // if user in the room, broadcast all others the update text and properties
      if(pageView === "room") {
        updateTempTextData(newText, font, fontSize, fontColor, textCoordinates);
      }
    },

    fontSizeSelect: (newFontSize) => {
      setFontSize(newFontSize);

      // if user in the room, broadcast all others the update text and properties
      if(pageView === "room") {
        updateTempTextData(text, font, newFontSize, fontColor, textCoordinates);
      }
    },

    fontColorSelect: (newFontColor) => {
      setFontColor(newFontColor);

      // if user in the room, broadcast all others the update text and properties
      if(pageView === "room") {
        updateTempTextData(text, font, fontSize, newFontColor, textCoordinates);
      }
    },

    fontSelect: (newFont) => {
      setFont(newFont);

      // if user in the room, broadcast all others the update text and properties
      if(pageView === "room") {
        updateTempTextData(text, newFont, fontSize, fontColor, textCoordinates);
      }
    }
  }


  const updateState = (currentState) => {

    /*
    Every page will have a particular state, which is an array of an array of Path class instances.
    The first element in the state of a page will always be an empty array (initial state of a page)
    
    Afterwards, we will add the entire Path class instances array which is our 'paths' variable to the state of that
    particular page.

    In short, a state will have many forms of our 'paths' variable
    */

    // After updating Paths and Pages, update State
    // the finishDrawing function calls updateState

    // if in collaboration mode, we don't manage states
    if(pageViewRef.current === "room") {
      console.log("%cIn room, so don't update state", "color: orange");
      return;
    }

    // Function to find whether current page state exists in the 'states' variable or not

    let helper = (state) => {
      return state.getPageNumber() === (pageIndex+1);
    }

    let isCurrentPageStatePresent = states.some(helper)


    // CREATE A NEW OBJECT INSIDE STATES IF THERE IS NOT ONE
    if(!isCurrentPageStatePresent) {
      //console.log("%cNEW SLIDE", "color: orange;");

      let newState = new PageState(pageIndex + 1,
        [[], currentState])

      // Also increment the current state index of this particular state
      newState.incrementCurrentStateIndex();

      setStates([...states, newState])

    }
    else {
      // Existing page
      //console.log("%cEXISTING SLIDE", "color: orange;");

      let newStates = states.map((state) => {

        if(state.getPageNumber() === (pageIndex + 1)) {
          // inside the state referring to current page

          state.addState(currentState);
          state.incrementCurrentStateIndex();
          return state;
        } 
        else {
          return state;
        }
      })

      setStates(newStates);
    }
    contextRef.current.closePath();

    setIsAddingText(false);
    setIsTextPositionSelected(false);

    //console.log("STATE UPDATED, PREV STATE")
    //console.log(states);
  }

  // function to limit precision of of given x by the given no. of decimal places
  const limitPrecision = (x, decimalPlaces) => {
    return Math.round(x * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);
  }

  
  // cancel text, don't add it
  const cancelText = () => {

    setIsAddingText(false);
    setIsTextPositionSelected(false);
    setText("Text");

    setSelectedTool("pen");

    // if user in the room, send event to release focus
    // as no text was added, no board update activity event will be sent
    if(pageViewRef.current === "room") {

      releaseFocus(currentUserData.userName, currentRoomData.roomId);

      // just send event to inform others to clear tempTextData 
      ws.current.send(JSON.stringify({
        action: "REMOVE_TEMP_TEXT_DATA",
        payload: {
          roomId: currentRoomData.roomId,
          userName: currentUserData.userName
        }
      }))
    }
    
  }

  // function to add new text to Paths, Pages
  const addText = () => {

    if(text.length === 0) return;

    let textProps = {
      position: [textCoordinates.x, textCoordinates.y],
      dimensions: [textDimensions.width, textDimensions.height],
      text: text,
      fontSize: fontSize,
      fontColor: fontColor,
      font: font
    }

    // if in collboration mode, we need to normalize the text starting position coordinates
    // the dimensions and also the font size;
    if(pageViewRef.current === "room") {

      const normalizedPositionX = limitPrecision(textCoordinates.x / canvasRef.current.width, 4);
      const normalizedPositionY = limitPrecision(textCoordinates.y / canvasRef.current.height, 4);

      const normalizedPosition = [normalizedPositionX, normalizedPositionY];

      const normalizedDimensionX = limitPrecision(textDimensions.width / canvasRef.current.width, 4);
      const normalizedDimensionY = limitPrecision(textDimensions.height / canvasRef.current.height, 4);
      
      const normalizedDimensions = [normalizedDimensionX, normalizedDimensionY];
      const normalizedFontSize = limitPrecision(fontSize / canvasRef.current.width, 4);

      textProps.normalizedPosition = normalizedPosition;
      textProps.normalizedDimensions = normalizedDimensions;
      textProps.normalizedFontSize = normalizedFontSize;
    }
    // if user in collboration mode, add isBroadcasted flag, normalizedPoints will be null

    // New Path instance with textProps
    const path = new Path(
      paths.length + 1,
      "regular",
      null,
      null,
      null,
      null,
      "text",
      textProps,
      null,
      null,
      pageView === "room" ? true : false,
      null
    );


    let tempPaths;

    // IF DRAWING FOR THE FIRST TIME, PAGES = []
    if(pages.length === 0) {

      tempPaths = [path];
      const newPages = [...pages, tempPaths];

      setPages(newPages);

      // if user in the room
      // broadcast the updated pages to all in the room
      // and releaseFocus 
      if(pageViewRef.current === "room") {
        const page = newPages[pageIndex];

        updateBoardActivity(
          currentUserData.userName, currentRoomData.roomId,
          page, pageIndex
        );

        releaseFocus(currentUserData.userName, currentRoomData.roomId);
      }

    }
    else {
      
      tempPaths = [...pages[pageIndex], path]

      const newPages = pages.map((initialPaths, index) => {
        if(index === pageIndex) {
          return initialPaths = tempPaths;
        }
        else {
          return initialPaths;
        }
      })

      setPages(newPages);

      // if user in the room
      // broadcast the updated pages to all in the room
      // and releaseFocus 
      if(pageViewRef.current === "room") {
        const page = newPages[pageIndex];

        updateBoardActivity(
          currentUserData.userName, currentRoomData.roomId,
          page, pageIndex
        );

        releaseFocus(currentUserData.userName, currentRoomData.roomId);
      }
    }

    // Update text state after all this
    updateState(tempPaths);
    // the updateState returns if user is in collboration mode
    // as we don't manage states in multi user mode

    // switch tool to "pen"
    setSelectedTool("pen");

    // set text to default value for next time
    setIsAddingText(false);
    setIsTextPositionSelected(false);
    setText("Text");
  }


  const drawPath = (eachPath) => {

    if(eachPath.getPoints().length === 0) {
      return;
    }

    contextRef.current.beginPath()

    // if in collaboration mode
    if(eachPath.isBroadcasted) {

      let firstPoint = eachPath.getNormalizedPoints()[0];

      const actualX = (firstPoint.getX() * canvasRef.current.width);
      const actualY = (firstPoint.getY() * canvasRef.current.height);

      contextRef.current.moveTo(actualX, actualY);
    }
    else {

      let firstPoint = eachPath.getPoints()[0];
      contextRef.current.moveTo(firstPoint.getX(), firstPoint.getY());
    }
    

    switch(eachPath.getType()) {
      case "regular":
        contextRef.current.setLineDash([]);
        break;
      case "dashed":
        contextRef.current.setLineDash([8,8]);
        break;
      case "dotted":
        contextRef.current.setLineDash([3,4]);
        break;
      default:
        contextRef.current.setLineDash([]);
        break;
    }

    // if in collaboration mode, use normalizedPoints to draw
    // after multiplyiing by current user canvas width and height respectively

    if(eachPath.isBroadcasted) {

      for(let k = 1; k < eachPath.getNormalizedPoints().length; k++) {

        let point = eachPath.getNormalizedPoints()[k];

        const actualX = (point.getX() * canvasRef.current.width);
        const actualY = (point.getY() * canvasRef.current.height);

        contextRef.current.lineTo(actualX, actualY);
      }
    }
    else {

      for(let k = 1; k < eachPath.getPoints().length; k++) {
      
        let point = eachPath.getPoints()[k];
        contextRef.current.lineTo(point.getX(), point.getY());
      }

    }

    contextRef.current.strokeStyle = eachPath.getColor();
    contextRef.current.lineWidth = eachPath.getSize();
    contextRef.current.globalAlpha = eachPath.getOpacity();
    
    contextRef.current.stroke();
    contextRef.current.closePath();

    
    // reset opacity for other paths/text
    contextRef.current.globalAlpha = 1;
    
  }


  const drawText = (eachPath) => {

    const textProps = eachPath.getTextProps() || null;

    if(textProps === null) return;

    // if user is in the room, we use normalized position and fontsize

    let textPosition;
    let fontString;

    if(eachPath.isBroadcasted) {

      const actualPositionX = Math.round(textProps.normalizedPosition[0] * canvasRef.current.width);
      const actualPositionY = Math.round(textProps.normalizedPosition[1] * canvasRef.current.height);

      textPosition = [actualPositionX, actualPositionY];
      const actualFontSize = Math.round(textProps.normalizedFontSize * canvasRef.current.width);

      fontString = `${actualFontSize}px ${textProps.font}`;
    }
    else {
      // user is not in collab mode

      textPosition = textProps.position;  // x,y coordinates of text
      fontString = `${textProps.fontSize}px ${textProps.font}`;
    }

    // these values remain same whether user is in collaboration mode or not
    let fontColor = textProps.fontColor;
    let _text = textProps.text;

    // we need to make sure that all our fonts are loaded before using any
    document.fonts.load(fontString).then((val) => {

      contextRef.current.globalAlpha = 1;      // set opacity is 100%
      contextRef.current.fillStyle = fontColor;
      contextRef.current.font = fontString;
      contextRef.current.fillText(_text, textPosition[0], textPosition[1]);
    })

  }


  const drawPaths = (currentPaths) => {
    

    if(currentPaths?.length > 0) {
      for(const path of currentPaths) {
        // For paths ->  drawPath()
        // For text ->   drawText()
        // For shapes -> drawShape()
        let category = path.getCategory();

        //console.log("CATEGORY: ", category);

        switch(category) {
          case "path":
            //console.log("DRAWPATH");
            drawPath(path);
            break;
          case "text":
            //console.log("DRAWTEXT");
            drawText(path)
            break;
          default:
            break;
        }
      }
    }
  }


  const drawRuledPageLines = () => {

    // as our lines are going to be of same color and same width
    // we can call beginPath() method once in the beginning
    // then write code to draw all the lines according to canvasHeight
    // then call the stroke() method only once at the end

    // Doing this works only if all the strokes will have same color and width
    // not otherwise

    const h = ruleHeight;

    const DPR = window.devicePixelRatio || 1;

    const x = Math.ceil(canvasRef.current.getBoundingClientRect().width) * DPR;

    const canvasHeight = Math.ceil(canvasRef.current.getBoundingClientRect().height) * DPR;


    // console.log("CANVAS WIDTH: ", x * DPR);
    // console.log("CANVAS HEIGHT: ", canvasHeight * DPR);
    // console.log("BOUNDING RECT PROPS: ", canvasRef.current.getBoundingClientRect());

    contextRef.current.beginPath();

    contextRef.current.globalAlpha = 1;

    const linesToBeDrawn = Math.floor(canvasHeight / h);

    console.log("Lines: ", linesToBeDrawn);

    for(let k = 1; k <= linesToBeDrawn; k++) {

      contextRef.current.moveTo(0, k*h);
      contextRef.current.lineTo(x, k*h);

    }

    // this line is important because the pen style might be "dashed" and if that is the case
    // these ruled lines will also be "dashed"
    // we have to change this property for this function otherwise it inherits
    // it from the drawPath function where line dash is definede
    contextRef.current.setLineDash([]);

    contextRef.current.lineWidth = 1;
    contextRef.current.strokeStyle = ruleColor;
    
    contextRef.current.stroke();

  }

  // function to display the current text being added on the canvas
  // the redraw method is called whenever any font properties changes
  // size, color, font or text.
  const textBeingAdded = () => {

    const fontString = `${fontSize}px ${font}`;

    //we will draw the text as well as a rectangle wrapping it
    contextRef.current.textBaseline = "top";
    // other values - hanging, middle, default - alphabetic

    contextRef.current.globalApha = 1;   // opacity
    contextRef.current.font = `${fontSize}px ${font}`;
    contextRef.current.fillStyle = fontColor;
    contextRef.current.fillText(`${text}`, textCoordinates.x, textCoordinates.y);


    // drawing box around text
    const textMetrics = contextRef.current.measureText(text);
    const textWidth = Math.ceil(textMetrics.width);
    const textHeight = textMetrics.actualBoundingBoxAscent + 
                       textMetrics.actualBoundingBoxDescent + 1;

    // update textDimensions
    setTextDimensions({...textDimensions, width: textWidth, height: textHeight});

    // 'actualBoundingBoxAscent' gives the distance from the baseline to 
    // the top of the highest character.

    // 'actualBoundingBoxDescent' gives the distance from the baseline 
    // to the bottom of the lowest character.

    // coordinates for rectangle
    const topLeft = {x: textCoordinates.x, y: textCoordinates.y};
    const topRight = {x: topLeft.x + textWidth, y: topLeft.y};
    const bottomLeft = {x: topLeft.x, y: topLeft.y + textHeight};
    const bottomRight = {x: topLeft.x + textWidth, y: topLeft.y + textHeight}

    contextRef.current.beginPath();
    contextRef.current.lineWidth = 1;
    contextRef.current.strokeStyle = "#2a91f7";

    // just a small difference for bounding box so that it does not appear tight
    const D = 3;

    // drawing wrapper rectangle
    const WRAPPER_WIDTH = topRight.x + D - (topLeft.x - D);
    const WRAPPER_HEIGHT = bottomLeft.y + D - (topLeft.y - D);

    contextRef.current.rect(topLeft.x - D, topLeft.y - D, WRAPPER_WIDTH, WRAPPER_HEIGHT);

    contextRef.current.stroke();
    contextRef.current.closePath();

    // drawing corner dots/circles
    const RADIUS = 2;

    contextRef.current.fillStyle = "#2a91f7";

    contextRef.current.beginPath();
    contextRef.current.arc(topLeft.x - D, topLeft.y - D, RADIUS, 0, 2 * Math.PI);
    contextRef.current.fill();

    contextRef.current.beginPath();
    contextRef.current.arc(topRight.x + D, topRight.y - D, RADIUS, 0, 2 * Math.PI);
    contextRef.current.fill();

    contextRef.current.beginPath();
    contextRef.current.arc(bottomLeft.x - D, bottomLeft.y + D, RADIUS, 0, 2 * Math.PI);
    contextRef.current.fill();

    contextRef.current.beginPath();
    contextRef.current.arc(bottomRight.x + D, bottomRight.y + D, RADIUS, 0, 2 * Math.PI);
    contextRef.current.fill();
  }


  // displays text while some other user is adding it (in collaboration mode)
  const displayTempText = () => {

    //console.log("DISPLAY TEMP TEXT FUNCTION");
    // we have normalizedFontsize and normalized coordinates
    // we need to compute actual wrt canvas width and height
    const actualX = Math.round(tempTextData.normalizedCoordinates.x * canvasRef.current.width);
    const actualY = Math.round(tempTextData.normalizedCoordinates.y * canvasRef.current.height);

    const fontSize = Math.round(tempTextData.normalizedFontSize * canvasRef.current.width);
    // font size was normalized relative to canvas width

    const fontString = `${fontSize}px ${tempTextData.font}`;

    // load the specific font and size first
    document.fonts.load(fontString).then((val) => {

      contextRef.current.textBaseline = "top";

      contextRef.current.globalAlpha = 1;    // opacity = 1
      contextRef.current.font = `${fontSize}px ${tempTextData.font}`;
      contextRef.current.fillStyle = tempTextData.fontColor;
      
      contextRef.current.fillText(`${tempTextData.text}`, actualX, actualY);
    })

  }

  const redraw = () => {

    // FIRST CLEAR THE ENTIRE CANVAS
    contextRef.current.clearRect(0,0,canvasRef.current.width, canvasRef.current.height);

    // if pageType is ruled, call function to draw lines on canvas
    if(pageType === "ruled") {
      drawRuledPageLines()
    }

    // while text is being added
    if(isAddingText && isTextPositionSelected) {
      // console.log("TEXT BEING ADDED");
      // this function handles text display logic while text is being added
      textBeingAdded();
    }


    // the tempTextDataUpdate() fuction updates the temp text data
    // and whenever that tempTextDatt state changes, this use effect is called
    // and we display the text temporarily
    // if the user in control, successfully adds the text, we change the tempTextData.text = null
    // upon which, we don't run the displayTempText function

    // console.log(tempTextData);
    if(tempTextData.text !== null && pageViewRef.current === "room") {
      displayTempText();
    }

    drawPaths(paths);
  }


  const startDrawing = (e) => {

    if(selectedTool === null) {
      return
    }

    // is the user is disblaed, prevent anything on the board
    if(currentUserData.isDisabled && pageViewRef.current === "room") return;

    //console.log("START DRAWING CALLED");

    setIsDrawing(true)

    let rect = canvasRef.current.getBoundingClientRect()

    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;

    let x = Math.round((e.clientX - rect.left) * scaleX);
    let y = Math.round((e.clientY - rect.top) * scaleY);

    let point = new Point(x, y);

    // Create a new Path object with just 1 initial point
    // All others points will be added to this Path object's path propert
    // as we continue drawing

    // if user is in collaboration mode, we need the "isBroadcasted" flag and also 
    // the normalizedPoints array
    let normalizedPoints = [];

    if(pageViewRef.current === "room") {

      const normalizedX = limitPrecision(x / canvasRef.current.width, 4);
      const normalizedY = limitPrecision(y / canvasRef.current.height, 4);
      const normalizedPoint = new Point(normalizedX, normalizedY);

      normalizedPoints = [normalizedPoint];
    }

    const path = new Path(
      paths.length + 1, 
      selectedType, 
      [point], 
      selectedColor, 
      selectedSize, 
      selectedOpacity,
      "path",
      null,
      null,
      null,
      pageView === "room" ? true : false,  // isBroadcasted boolean flag
      normalizedPoints
    );

    // Initially, we have an empty page in 'pages' state
    // so we just need to update that and not care about adding a new 
    // array inside 'pages'
    // pageIndex = 0 initially, so that points to that empty array 

    let tempPaths = [...pages[pageIndex], path]

    let newPages = pages.map((initialPaths, index) => {
      if(index === pageIndex) {
        initialPaths = tempPaths;
        return initialPaths;
      }
      else {
        return initialPaths;
      }
    })

    setPages(newPages);

    // setPages calls setPaths using the useEffect hook
    // in return when paths i changed, it calls redraw() function
    // so we don't need to call redraw everywhere
  }

  // to delay releaseFocus event
  const releaseFocusTimeoutId = useRef(null);

  const finishDrawing = () => {

    // is the user is disblaed, prevent anything on the board
    if(currentUserData.isDisabled && pageView === "room") return;

    if(isAddingText) {
      return;
    }

    if(!isDrawing) {
      return;
    }

    //if(pages.length < 1 || paths.length < 1) return;

    let currentPage = pages[pageIndex];

    if(selectedTool === "pen") {
      //if(lastPath.getPoints() === null) return;
      // const firstPoint = lastPath.getPoints().at(0);
      // const lastPoint = lastPath.getPoints().at(-1);
      setIsDrawing(false);

      if(pageViewRef.current === "room") {
        // send event to change the isFocused flag to false, as user finished drawing
        // and is no longer in focus
        releaseFocusTimeoutId.current = setTimeout(() => {
          //console.log(`%cSENDING RELEASE FOCUS EVENT ${paths.length}`, "color: red;");
          releaseFocus(currentUserData.userName, currentRoomData.roomId);
        }, 1000);
      }
      else {
        // in single user mode, we manage states
        updateState(currentPage);
      }

    } 
    else if(selectedTool === "eraser") {
      // isDrawing value also decides whether to erase or not
      //console.log("FINISH DRAWING WITH ERASER");
      setIsDrawing(false);

      if(pageViewRef.current === "room") {
        // if in room, we need to releaseFocus and update the lastInteractionTime 

        releaseFocusTimeoutId.current = setTimeout(() => {
          releaseFocus(currentUserData.userName, currentRoomData.roomId);
        }, 1000);
      }

    } else {
      console.log("OTHER TOOL");
    }
    // updateState(currentState);
  }

  const draw = (e) => {

    if(!isDrawing) {
      return
    }

    // is the user is disblaed, prevent anything on the board
    if(currentUserData.isDisabled && pageView === "room") return;

    //console.log("DRAWING");

    let rect = canvasRef.current.getBoundingClientRect();

    // we need to do this to make sure the coordinate of pen
    // gets to right place, if the window is resized
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;

    let x = Math.round((e.clientX - rect.left) * scaleX);
    let y = Math.round((e.clientY - rect.top) * scaleY);

    let point = new Point(x, y);


    // Creating a deep copy of 'pages'
    // this method is more expensive for large arrays
    //let tempPages = JSON.parse(JSON.stringify(pages));

    // this is better
    let newPages = pages.map((page, index) => {
      let newPage = [];

      for(const pathObj of page) {
        newPage = [...newPage, pathObj];
      }

      return newPage;
    })

    // Push the Point instance to the last path object
    const l = newPages[pageIndex].length;
    let lastPathObj = newPages[pageIndex][l - 1];


    if(lastPathObj.getCategory() === "path") {

      lastPathObj.addPoint(point);


      if(pageView === "room") {
        // broadcast "newPages" to the room
        // along with pageIndex
        // send event "UPDATE_BOARD_ACTIVITY"

        // before that we need to normalize the coordinates and then sent it
        // as just sending the current user's coordinates might go out of canvas for others
        // if their window width is less
        // we normalize the coordinates wrt canvas width and height, then store it and then send
        const normalizedX = limitPrecision(x / canvasRef.current.width, 4);
        const normalizedY = limitPrecision(y / canvasRef.current.height, 4);
        const normalizedPoint = new Point(normalizedX, normalizedY);

        lastPathObj.addNormalizedPoint(normalizedPoint);

        const page = newPages[pageIndex];

        updateBoardActivity(
          currentUserData.userName, currentRoomData.roomId, page, pageIndex
        );
      }

      // at last
      // update pages state with this entirely new array 'newPages'
      setPages(newPages);
    }

  }


  // ON MOUSE DOWN
  const handleMouseDown = async (e) => {
    if(selectedTool === null) return;

    // is the user is disblaed, prevent anything on the board
    if(currentUserData.isDisabled && pageViewRef.current === "room") return;

    // before doing anything, check whether boardLock is available or not
    // we request lock for pen tool, text tool, eraser tool
    // we cannot be dependent on current boardLock state data
    // before we start drawing, adding text, erasing, we need to check the latest
    // boardLock data and request for it

    let condition = selectedTool === "pen" || selectedTool === "text" || selectedTool === "eraser"

    let acquiredLock = false;  // initially false

    // if the useris Adding text, it means he already has the lock,
    // in that case, we just ignore all these statements
    if(pageViewRef.current === "room" && condition && !isAddingText) {
      //console.log("REQUESTING LOCK ON MOUSE DOWN");
      acquiredLock = await requestLock(
        currentUserData.userName,
        selectedTool,
        currentRoomData.roomId
      )
    }

    // check if lock was acquired
    if(condition && pageViewRef.current === "room" && !acquiredLock && !isAddingText) {
      // console.log("LOCK NOT ACQUIRED, RETURN");
      return;
    }
    else if(condition && pageViewRef.current === "room" && acquiredLock && !isAddingText) {
      // console.log("LOCK ACQUIRED, CONTINUE");

      // if user started interacting again within 1 seconds, cancel the timeout to send
      // releaseFocus event
      if(releaseFocusTimeoutId.current) {
        //console.log(`%cCLEARING TIMEOUT: ${releaseFocusTimeoutId.current}`, "color: orange;");
        clearTimeout(releaseFocusTimeoutId.current);
      }
    }

    let rect = canvasRef.current.getBoundingClientRect();

    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;

    let x = Math.round((e.clientX - rect.left) * scaleX);
    let y = Math.round((e.clientY - rect.top) * scaleY);


    switch(selectedTool) {
      case "pen":
        setIsDrawing(true);

        startDrawing(e)
        break;
      case "eraser":
        setIsDrawing(true);

        contextRef.current.moveTo(x,y);
        //setIsDrawing(true)
        break;
      case "text":

        if(isTextPositionSelected === false) {
            // On click, set coordinates to the points where cursor was clicked
            setTextCoordinates({...textCoordinates, x: x , y: y})
            // put both states to true
            setIsTextPositionSelected(true);
            setIsAddingText(true);
            // lock has been acquired and isFocused = true as well
            // while the text has not been successfully added, we will not release focus
            // focus will be released inside addText function or cancelText function
        } else {
            // position already selected, update it
            setTextCoordinates({...textCoordinates, x: x, y: y});

            // if in the room, broadcast the updated text properties 
            if(pageViewRef.current === "room") {
              const newCoordinates = {x: x, y: y};

              updateTempTextData(text, font, fontSize, fontColor, newCoordinates);
            }
        }

        break;
      case "shape-detection":
        
        console.log("FEATURE NOT FUNCTIONAL");
        setIsDrawing(false);
        break;
      default:
        console.log("Invalid Tool!");
        setIsDrawing(false);
        break;
    }
  }

  // ON MOUSE MOVE
  const handleMouseMove = (e) => {
    if(!isDrawing) {
      //console.log("NOT DRAWING, SO NOT MOVING");
      return
    }

    // is the user is disblaed, prevent anything on the board
    if(currentUserData.isDisabled && pageView === "room") return;


    switch (selectedTool) {
      case "pen":
        //console.log("MOUSE MOVING WITH PEN TOOL");
        draw(e)
        break;
      case "eraser":
        //console.log("MOUSE MOVING WITH ERASER TOOL");
        erase(e)
        break;
      default:
        setIsDrawing(false);
        console.log("Other Tool")
    }
  }

  // ON MOUSE OUT, if cursor moves out of canvas while drawing or erasing
  const handleMouseOut = () => {

    // is the user is disblaed, prevent anything on the board
    if(currentUserData.isDisabled && pageView === "room") return;

    //console.log("MOUSE GOES OUT OF THE CANVAS");

    // if in the room, send RELEASE_FOCUS event
    if(isDrawing && pageView === "room") {
      releaseFocus(currentUserData.userName, currentRoomData.roomId);
    }

    // stop drawing or erasing
    setIsDrawing(false);
  }

  const saveCanvas = () => {
    console.log("Downloading Canvas...");
    
    // creating a temporary export canvas with white background
    const exportCanvas = document.createElement("canvas");
    const ctx = exportCanvas.getContext("2d");
    exportCanvas.width = canvasRef.current.width;
    exportCanvas.height = canvasRef.current.height;

    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // draw the original canvas data on this export Canvas
    ctx.drawImage(canvasRef.current, 0, 0);

    const dataURL = exportCanvas.toDataURL("image/png");

    // attaching linke to this URL
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = `Page ${pageIndex + 1}.png`;

    link.click();
  }

  const clearCanvas = () => {

    contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    if(pageViewRef.current === "room") {
      console.log("Collaboration Mode Clear Canvas");
      // open confirmation dialog 
      setConfirmationDialogMessage("The action permanently clears the page. Are you sure?");
    
      setConfirmationDialogType("CLEAR_CANVAS");
      setConfirmationDialogUserName("");

      openConfirmationDialog();
      // the rest is handled inside confirmationdialog.js

    }
    else {
      console.log("Single User Mode Clear Canvas");
      // single user mode
      // make the current page empty, leave others as they are
      setPages((initialPages) => initialPages.map((page, index) => {
        if(index === pageIndex) {
          page = [];
          return page;
        }
        return page;
      }))

      // remove the page state of current page only, and leave the rest
      let newStates = states.filter((state) => {
        return state.getPageNumber() !== (pageIndex + 1);
      })

      setStates(newStates);

      // clear ruled lines, if present
      setPageType("plain");
    }
    
  }

  const erase = (e) => {
    // erase function was very long so functions are moved to eraseFunctions.js
    // one for single user erase and other for collaboration mode
    if(!isDrawing) {
      return;
    }
    if(removingPath) {
      return;
    }
    if(selectedTool === null) {
      return;
    }

    // is the user is disblaed, prevent anything on the board
    if(currentUserData.isDisabled && pageView === "room") return;

    let output;

    if(pageViewRef.current === "room") {

      output = eraseMultiUser(contextRef, e, paths, pageIndex, pages, setPages, removingPath, setRemovingPath, canvasRef);

      // if any path was erased and removed successfully, broadcast data to all in the room
      if(output.success) {
        const newPaths = output.newPaths;   // this is basically, newPages[pageIndex];

        // dont manage states in collaboration mode
        //updateState(newPaths);

        // broadcast current page paths to all in the room
        updateBoardActivity(currentUserData.userName, currentRoomData.roomId, newPaths, pageIndex);
      }
    }
    else {
      output = eraseSingleUser(e, paths, pageIndex, pages, setPages, removingPath, setRemovingPath, canvasRef);
      // update state
      updateState(output.newPaths);
    }
    // stop only if mouse goes up, inside finishDrawing function
  }


  const handleAddPage = () => {

    // don't allow more than 9 pages
    if(pages.length === 9) {
      console.log("CANNOT ADD MORE PAGES");
      return;
    }

    // ADD AN EMPTY PAGE
    setPages([...pages, []])

    // if not in room, move to the next page
    // but not if in room
    if(pageView !== "room") {
      setPageIndex((prevState) => prevState + 1);
    }

    // if in the room, broadcast event about adding page to all
    if(pageView === "room") {

      const data = {
        action: "ADD_NEW_PAGE",
        payload: {
          userName: currentUserData.userName,
          roomId: currentRoomData.roomId
        }
      }

      ws.current.send(JSON.stringify(data));
    }
    
  }

  const handleNextSlide = () => {

    if(pageIndex >= pages.length - 1) return;

    console.log("Next Slide");

    if(pageViewRef.current === "room") {
      // no user can change the slide if the board is in focus
      // only the request is sent to increment page, if the board as not focused
      // page is incremented, otherwise not
      const data = {
        action: "INCREMENT_PAGE",
        payload: {
          userName: currentUserData.userName,
          roomId: currentRoomData.roomId,
          pageIndex: pageIndex + 1
        }
      }

      ws.current.send(JSON.stringify(data));
    }
    else {
      // single user mode
      setPageIndex(prevState => prevState + 1);
    }
  
  }

  const handlePrevSlide = () => {

    if(pageIndex <= 0) return;

    console.log("Prev Slide");
    
    if(pageViewRef.current === "room") {
      // no user can change the slide if the board is in focus
      // request is sent to decrement page
      const data = {
        action: "DECREMENT_PAGE",
        payload: {
          userName: currentUserData.userName,
          roomId: currentRoomData.roomId,
          pageIndex: pageIndex - 1
        }
      }

      ws.current.send(JSON.stringify(data));
    }
    else {
      // single user mode
      setPageIndex(prevState => prevState -1);
    }

  }

  const handleUndo = () => {
    if(canUndo() === false) return;

    let currentPageState = states.find((state) => {
      return state.getPageNumber() === (pageIndex + 1);
    })

    if(currentPageState.getCurrentStateIndex() === 0) {
      // AT FIRST STATE, CANNOT UNDO
      return
    }

    // HANDLE UNDO
    // console.log(currentPageState.getStates());

    // As the function is Undo, we will decrement state index and update our 'pages' variable
    currentPageState.decrementCurrentStateIndex();

    let tempPages = [...pages].map((page, index) => {
      if(index === pageIndex) {
        page = currentPageState.getState();
        return page;
      } else {
        return page;
      }
    })
    
    setPages(tempPages);
  }

  const handleRedo = () => {
    if(canRedo() === false) return;

    let currentPageState = states.find((state) => {
      return state.getPageNumber() === (pageIndex+1);
    })

    if(currentPageState.getCurrentStateIndex() === (currentPageState.getStates().length - 1)) {
      // AT LAST STATE, CANNOT REDO
      return;
    }

    // As the function is Redo, we will increment state index and update our 'pages'
    currentPageState.incrementCurrentStateIndex();
    
    let tempPages = [...pages].map((page, index) => {
      if(index === pageIndex ) {
        page = currentPageState.getState();
        return page;
      } else {
        return page;
      }
    })

    setPages(tempPages);
  }

  // Function to determine whether 'undo' button will be disabled or not
  const canUndo = () => {

    // if in collboration mode, we cannot undo or redo
    if(pageViewRef.current === "room") {
      return false;
    }

    let currentPageState = states.find((state) => {
      return state.getPageNumber() === (pageIndex+1);
    })


    if(currentPageState === undefined) {
      return false;
    }


    if(currentPageState.getStates().length === 0) {
      return false;
    }

    if(currentPageState.getCurrentStateIndex() === 0) {
      return false;

    } else {
      return true;

    }
  }

  const canRedo = () => {

    // if in collboration mode, we cannot undo or redo
    if(pageViewRef.current === "room") {
      return false;
    }

    let currentPageState = states.find((state) => {
      return state.getPageNumber() === (pageIndex+1);
    })

    if(currentPageState === undefined) {
      return false;
    }


    if(currentPageState.getStates().length === 0) {
      return false;
    }
  
    if(currentPageState.getCurrentStateIndex() === (currentPageState.getStatesLength()-1)) {
      return false;

    } else {
      return true;
    }

  }


  // WEBSOCKET CONNECTION RELATED 

  const openConnection = () => {

    ws.current = new WebSocket(wsURL);

    ws.current.onopen = () => {
      console.log("WebSocket Connection Opened!");
    }

    ws.current.onmessage = (e) => {
      
      const data = JSON.parse(e.data);
      // console.log("RECEIVED DATA");
      // console.log(data);

      switch(data.action) {
        case "ROOM_NOT_FOUND":
          console.log("Invalid Room ID!");
          setCollaborateError("Invalid Room ID!");
          break;
        case "DUPLICATE_USERNAME":
          console.log("Username already present in room!");
          setCollaborateError("Username already present!");
          break;
        case "ROOM_IS_FULL":
          console.log("Room has reached max capacity!");
          setCollaborateError("Room is full!");
          break;
        case "USER_NOT_AN_OBJECT":
          console.log("User is not an object");
          setCollaborateError("There was some error!");
        case "ROOM_CREATED":
          roomCreated(data.payload);
          break;
        case "ROOM_CREATION_ERROR":
          setCollaborateError("Error creating room!");
          break;
        case "ROOM_JOINED":
          roomJoined(data.payload);
          break;
        case "ROOM_JOIN_ERROR":
          setCollaborateError("Error joining room!");
          break;
        case "NEW_USER_JOINED":
          newUserJoined(data.payload);
          break;
        case "USER_LEFT":
          userLeft(data.payload);
          break;
        case "ADMIN_LEFT":
          adminLeft(data.payload);
          break;
        case "KICK_OUT":
          console.log("KICK OUT ACTION");
          // when admin removes the currentUser
          kickedOut(data.payload);
          break;
        case "DISABLED":
          // when adming disables the current user
          disabled(data.payload);
          break;
        case "ENABLED":
          // if admin enables the current user
          enabled(data.payload);
          break;
        case "ENABLE_REQUEST":
          // if some disabled user, sends enable request to admin
          incomingEnableRequest(data.payload);
          break;
        case "ENABLE_REQUEST_REJECTED":
          // if admin rejects enable request of the current user
          enableRequestRejected(data.payload);
          break;
        case "UPDATED_USERS":
          // sent just to update the users array
          // sent if admin disables some user
          updatedUsers(data.payload);
          break;
        case "LOCK_ACQUIRED":
          // lock was successfully aquired
          lockAquired(data.payload)
          break;
        case "LOCK_NOT_ACQUIRED":
          // lock was not available
          console.log("LOCK NOT AQUIRED");
          setBoardLockAvailable(false);
          break;
        case "LOCK_UPDATED":
          // some other user acquired the lock
          lockUpdated(data.payload);
          break;
        case "BOARD_STATE_UPDATE":
          // sent when person in control draws, adds text on board
          // so that all users are in sync and have the same paths on the board
          boardStateUpdate(data.payload);
          break;
        case "TEMP_TEXT_DATA_UPDATE":
          // sent by the person adding text, in collboration mode
          // just to display the same text temporarily on others while he is adding
          tempTextDataUpdate(data.payload);
          break;
        case "REMOVE_TEMP_TEXT_DATA":
          // sent by the user that was adding text but decides to cancel it
          // so clear the tempTextData state
          removeTempTextData();
          break;
        case "PAGE_TYPE_UPDATE":
          // sent by anyone in the room, for updated page type, rule color, height
          pageTypeUpdate(data.payload);
          break;
        case "NEW_PAGE_ADDED":
          // some user in the room, added a new page
          newPageAdded(data.payload);
          break;
        case "PAGE_INCREMENT":
          // when some user moves page forward
          pageIncrement(data.payload);
          break;
        case "PAGE_DECREMENT":
          // someone moves page backward
          pageDecrement(data.payload);
          break;
        case "BOARD_IS_BUSY":
          // if the rqeuest to increment page by current user fails
          alert("Board is currently busy!");
          break;
        case "SEND_EXISTING_BOARD_DATA":
          // only the admin receives this event when some user joins
          // to send updated pages state and pageIndex
          sendExistingBoardData(data.payload);
          break;
        case "EXISTING_BOARD_DATA":
          // admin sends existing board data to newly joined user
          existingBoardData(data.payload);
          break;
        case "CANVAS_CLEARED":
          // when admin clears the canvas
          canvasCleared(data.payload);
          break;
        case "ACTION_RESTRICTED":
          // when some user tries to do something that can only be done by the admin
          alert("Admin privileges required for this action!");
          break;
        default:
          console.log("Invalid Action!", data.action);
          break;
      }

    }

    ws.current.onclose = () => {
      console.log("Server Connection Closed");
    }

    ws.current.onerror = () => {
      console.log("WebSocket Error, Closing Connection!");
      ws.current.close();
    }

  }

  const waitForOpenConnection = (socket) => {
    // socket - ws.current
    return new Promise((resolve, reject) => {

      const MAX_ATTEMPTS = 20;
      const intervalTime = 500; // ms
      let currentAttempt = 1;

      // we try max of 20 times for socket to OPEN, with 500ms gap between every 2 tries
      // if the socket does not open even after 10 attempts, we display error

      const interval = setInterval(() => {
        if(currentAttempt > MAX_ATTEMPTS) {
          clearInterval(interval);
          // there was some issue with the server
          setCollaborateError("Something went wrong!");
          reject(new Error("Max attempts exceeded!"));
        }

        if(socket.readyState === WebSocket.OPEN) {
          clearInterval(interval);
          resolve();
        }
       
        console.log(`Attempt ${currentAttempt} failed`);
        currentAttempt++;

      }, intervalTime)

    })

  }

  
  const createRoom = async () => {
    // make sure username contains only english alphabets and nothing else
    const regex = /^[A-Za-z]+$/;

    const isValidUserName = regex.test(userName);

    if(!isValidUserName) {
      setCollaborateError("Username accepts letters only!");
      return;
    }

    // 1 - start a loading spinner from here
    setCreateLoading(true);

    openConnection();

    const data = {
      action: "CREATE_ROOM",
      payload: {userName: userName.trim()}
    }

    // wait for socket connection to open
    if(ws.current.readyState !== WebSocket.OPEN) {
      try {
        await waitForOpenConnection(ws.current);

        console.log("Sending Data");
        ws.current.send(JSON.stringify(data));
      }
      catch(err) {
        console.log(err);
        //alert("Some Error!");
      }
    }
    else {
      console.log("Connection open, sending data");
      // connection already OPEN
      ws.current.send(JSON.stringify(data));
    }

    // 2 - stop the loading spinner here
    setCreateLoading(false);

  }

  const joinRoom = async () => {
    // make sure username contains only english alphabets and nothing else
    const regex = /^[A-Za-z]+$/;

    const isValidUserName = regex.test(userName);

    if(!isValidUserName) {
      setCollaborateError("Username accepts letter only!");
      return;
    }

    // start join room loading spinner
    setJoinLoading(true);

    openConnection();

    const data = {
      action: "JOIN_ROOM",
      payload: {
        userName: userName.trim(),
        roomId
      }
    }

    if(ws.current.readyState !== WebSocket.OPEN) {
      try {
        // wait for connection to open, then send "JOIN_ROOM" event
        await waitForOpenConnection(ws.current);
        ws.current.send(JSON.stringify(data));
      }
      catch(err) {
        console.log(err);
        //alert("Some Error!");
      }
    }
    else {
      // already OPEN
      ws.current.send(JSON.stringify(data));
    }

    // stop join room loading spinner
    setJoinLoading(false);
  }

  const leaveRoom = () => {

    // display confirmation dialog first
    setConfirmationDialogMessage("You are about to leave the room. Are you sure?");
    setConfirmationDialogType("LEAVE_ROOM");
    setConfirmationDialogUserName("");

    openConfirmationDialog();
    // everything else is handle inside confirmationDialog.js

  }

  const roomCreated = (payload) => {

    setCurrentRoomData((prev) => ({
      ...prev, 
      roomId: payload.roomId, users: payload.users, admin: payload.admin,
    }))

    setBoardLock((prev) => ({
      ...prev, 
      userName: payload.boardLock.userName,
      mode: payload.boardLock.mode,
      lastInteractionTime: payload.boardLock.lastInteractionTime,
      isAddingText: payload.boardLock.isAddingText
    }))

    // update currentUserData
    const currentUserObj = payload.users.find((user) => user._userName === userName);

    console.log("currentUserObj");
    console.log(currentUserObj);

    setCurrentUserData((prev) => ({
      ...prev, 
      ws: currentUserObj._ws, userName: currentUserObj._userName, 
      isDisabled: currentUserObj._isDisabled, isAdmin: currentUserObj._isAdmin
    }));

    // clear states if any and put all values to default
    setPages([]);  // sets paths due to useEffect hook
    setStates([]);
    setIsAddingText(false);
    setIsTextPositionSelected(false);
    setIsDrawing(false);


    // change page view
    setPageView("room");
    closeCollaborateModal();
  }

  const roomJoined = (payload) => {
    // if some user joined the room, we need to clear the existing data on his board
    // as well as the existing pages 
    // and update the pages with the pages of the admin of the room

    setCurrentRoomData((prev) => ({
      ...prev, 
      roomId: payload.roomId, users: payload.users, admin: payload.admin
    }))

    setBoardLock((prev) => ({
      ...prev, 
      userName: payload.boardLock.userName,
      mode: payload.boardLock.mode,
      lastInteractionTime: payload.boardLock.lastInteractionTime,
      isFocused: payload.boardLock.isFocused
    }))

    // update currentUserData
    const currentUserObj = payload.users.find((user) => user._userName === userName);

    setCurrentUserData((prev) => ({
      ...prev, 
      ws: currentUserObj._ws, userName: currentUserObj._userName,
      isDisabled: currentUserObj._isDisabled, isAdmin: currentUserObj._isAdmin
    }));

    setPageView("room");

    // close the modal only after the updated "pages" state and pageIndex has been received from
    // the admin

    //closeCollaborateModal();
  }

  const newUserJoined = (payload) => {
    // const latestRoomData = currentRoomDataRef.current;
    // console.log(latestRoomData);
    console.log("NEW USER JOINED!");

    setCurrentRoomData((prev) => ({
      ...prev, users: payload.users
    }));

    alert(`${payload.userName} joined!`);
  }

  const userLeft = (payload) => {

    setCurrentRoomData((prev) => ({
      ...prev, 
      users: payload.users, admin: payload.admin, 
    }));

    setBoardLock((prev) => ({
      ...prev, 
      userName: payload.boardLock.userName,
      mode: payload.boardLock.mode,
      lastInteractionTime: payload.boardLock.lastInteractionTime,
      isFocused: payload.boardLock.isFocused
    }))

    console.log("BOARD LOCK");
    console.log(payload.boardLock);

    alert(`${payload.userName} left!`);
    console.log(`${payload.userName} left`);

  }

  const adminLeft = (payload) => {

    alert(`Admin (${payload.userName}) left!`);
    window.location.reload();
  }

  const kickedOut = (payload) => {
    alert(`Admin (${payload.adminName}) removed you!`);

    window.location.reload();
  }

  const disabled = (payload) => {
    alert(`Admin (${payload.adminName}) disabled you!`);

    setCurrentRoomData((prev) => ({
      ...prev, 
      users: payload.users
    }));

    // update current user data isDisabled flag
    setCurrentUserData((prev) => ({
      ...prev, 
      isDisabled: true
    }))
  }

  const enabled = (payload) => {
    alert(`Admin (${payload.adminName}) enabled you!`);

    // update users data and current user isDisabled value
    setCurrentRoomData((prev) => ({
      ...prev, 
      users: payload.users
    }))

    setCurrentUserData((prev) => ({
      ...prev, 
      isDisabled: false
    }))
  }

  const updatedUsers = (payload) => {

    // just to update the users array in the room
    setCurrentRoomData((prev) => ({
      ...prev,
      users: payload.users
    }));

    console.log("UPDATED USERS EVENT");
  }

  const requestLock = (userName, mode, roomId) => {

    return new Promise((resolve) => {
      // we create a temporary listener for ws
      const handleMessage = (e) => {

        const data = JSON.parse(e.data);

        if(data.action === "LOCK_ACQUIRED") {

          // console.log("LOCK ACQUIRED (TEMP LISTENER)");
          // got the lock
          ws.current.removeEventListener("message", handleMessage);
          resolve(true);

          // updateing the boardLock state and lockAvaialbe status is done inside
          // the lockAcquired function which runs due to the same action "LOCK_ACQUIRED"
        }

        if(data.action === "LOCK_NOT_ACQUIRED") {
          ws.current.removeEventListener("message", handleMessage);
          resolve(false);
        }
      }

      // adding temporary listener
      ws.current.addEventListener("message", handleMessage);

      // send lock request
      const data = {
        userName: userName,
        mode: mode,
        roomId: roomId
      }

      ws.current.send(JSON.stringify({
        action: "REQUEST_LOCK", 
        payload: data
      }));
    })
  }

  const lockAquired = (payload) => {
    
    //console.log("LOCK AQUIRED");

    setBoardLock((prev) => ({
      ...prev, 
      userName: payload.boardLock.userName,
      mode: payload.boardLock.mode,
      lastInteractionTime: payload.boardLock.lastInteractionTime,
      isFocused: payload.boardLock.isFocused
    }))

    setBoardLockAvailable(true);
  }

  const lockUpdated = (payload) => {

    // some other user acquired the lock, so update the boardLock state
    setBoardLock((prev) => ({
      ...prev, 
      userName: payload.boardLock.userName,
      mode: payload.boardLock.mode,
      lastInteractionTime: payload.boardLock.lastInteractionTime,
      isFocused: payload.boardLock.isFocused
    }))

    //console.log("UPDATING LOCK, LOCK WITH = ", payload.boardLock.userName);
  }

  // when person in control interacts with the board
  const boardStateUpdate = (payload) => {

    // only the current page state is sent from the main user, not the entire "pages" state
    // console.log("-".repeat(20));
    // console.log("BOARD STATE UPDATE");
    // console.log(payload.page);
    // console.log("-".repeat(20));
    console.log("BOARD STATE UPDATE");

    // just the current page state was sent, not the entire pages state
    // convert all path objects to proper Path class instances
    const newPage = payload.page.map((pathObj) => {
      //console.log(pathObj);
      return Path.fromObject(pathObj);
    });

    // now form copy of pages state, and update the page at payload.pageIndex
    setPages((prevPages) => {
      
      const newPages = prevPages.map((page, index) => {
        if(index === payload.pageIndex) {
          return newPage;
        }
        else {
          return page;
        }
      })

      return newPages;
    })

    //setPages(newPages);
    setPageIndex(payload.pageIndex);

    // now update state, the function itself checks whether the current user is admin or not
    // because in room, only admin manages state, no one else
    updateState(newPage);

    // also clear the tempTextData state, 
    // even if the text is added, it is cleared, if the text is not added, it is cleared as well
    // but we do this if and only if the last path in payload.page is a "text" type
    // otherwise, this will be useless, and causes too many re-renders because of that function
    const lastPathObj = newPage.at(-1);

    if(lastPathObj && lastPathObj.getCategory() === "text") {
      removeTempTextData();
    }
  }

  // newly joined user gets existing board data
  const existingBoardData = (payload) => {
    // got entiere pages state
    // and pageIndex, we need to convert normal path objects into
    // proper Path instances
    const newPages = payload.pages.map((page, index) => {
      return page.map((pathObj) => {
        return Path.fromObject(pathObj);
      })
    })

    // update entire pages state
    setPages(newPages);

    // clear states if any and put all values to default
    setStates([]);
    setIsAddingText(false);
    setIsTextPositionSelected(false);
    setIsDrawing(false);


    setTimeout(() => {
      // close modal
      closeCollaborateModal();
    }, 500)
  }

  const removeTempTextData = () => {
    
    // set all properties to null
    setTempTextData((prev) => {
      const newState = {};

      for(const key in prev) {
        // set all fields to null
        newState[key] = null;
      }

      return newState
    });
  }

  const tempTextDataUpdate = (payload) => {

    console.log("GOT TEMP TEXT DATA");

    setTempTextData((prev) => ({
      ...prev, 
      text: payload.text,
      font: payload.font,
      normalizedFontSize: payload.normalizedFontSize,
      normalizedCoordinates: payload.normalizedCoordinates,
      fontColor: payload.fontColor
    }));
  }

  const pageTypeUpdate = (payload) => {

    setPageType(payload.pageType);
    setRuleColor(payload.ruleColor);
    setRuleHeight(payload.ruleHeight);
  }

  const newPageAdded = (payload) => {

    // add a new page
    setPages((prevPages) => [...prevPages, []]);

    // inform about new page
    setTimeout(() => {
      alert(`${payload.userName} added new page`);
    }, 500)
  }

  const pageIncrement = (payload) => {

    // increment pageIndex to payload.pageIndex
    setPageIndex(payload.pageIndex);
    console.log("PAGE INCREMENTED TO : ", payload.pageIndex);
  }

  const pageDecrement = (payload) => {

    // same as increment
    setPageIndex(payload.pageIndex);
  }

  const canvasCleared = (payload) => {
    // admin cleared the page with given pageIndex
    // put empty array in place of that page
    // update entire pages state
    setPages((initialPages) => initialPages.map((page, index) => {
        if(index === payload.pageIndex) {
          page = [];
          return page;
        }
        return page;
    }))

    // make sure lines are removed
    setPageType("plain");

    setTimeout(() => {
      alert(`Admin cleared page ${pageIndex + 1}`);
    }, 500)
  }

  // when disabled user sends enable request
  const incomingEnableRequest = (payload) => {

    // update confirmation dialog message and username
    // show dialog 
    // it might be the case that, the admin is currently focusing on the board and drawing
    // and if that happens, we need to call the finishDrawing() function before shwoing the dialog
    // becase that function stops drawing and updates the state, so the dialog will not intefere
    // with the paths

    // console.log("INCOMING ENABLE REQUEST");
    finishDrawing();

    setConfirmationDialogUserName(payload.userName);
    setConfirmationDialogMessage("wants to be enabled. Are you sure?");
    setConfirmationDialogType("ENABLE_REQUEST");

    // open dialog after small delay
    setTimeout(() => {
      openConfirmationDialog();
    }, 500)
  }

  // admin rejects the enable request
  const enableRequestRejected = (payload) => {

    alert("Admin rejected your enable request!");
  }


  // SENT BY THE CLIENT TO ALL IN THE ROOM
  const updateBoardActivity = (userName, roomId, page, pageIndex) => {

    // sent when user is drawing in the board and Point instances are added
    // also sent after user successfully adds a text on board
    // also sent if user erases a path or text on the board
    const data = {
      action: "UPDATE_BOARD_ACTIVITY", 
      payload: {
        userName: userName,
        roomId: roomId,
        page: page,
        pageIndex: pageIndex,
      }
    }

    // console.log("-".repeat(20));
    // console.log("BROADCASTING CURRENT PAGE ONLY");
    // console.log(page);
    // console.log("-".repeat(20));

    ws.current.send(JSON.stringify(data));
  }

  const releaseFocus = (userName, roomId) => {
    // sent when user is finished drawing
    // either in finishDrawing function or handleMouseOut function
    // also sent when user successfully adds a text

    const data = {
      userName: userName,
      roomId: roomId
    }

    ws.current.send(JSON.stringify({
      action: "RELEASE_FOCUS",
      payload: data
    }))

  }

  const copyRoomId = () => {

    // clipboard might or might not work
    // depending on the browser

    try {
      navigator.clipboard.writeText(currentRoomData.roomId);
      alert("Room ID copied!");
    }
    catch(err) {
      console.log("Failed to copy!");
      alert("Failed to copy!");
    }

  }

  const updateTempTextData = (text, font, fontSize, fontColor, textCoordinates) => {
    // the textCoordinates, fontsize must be sent after normalizing
    // fontsize is normalized relative to canvas width in our case
    const normalizedFontSize = limitPrecision(fontSize / canvasRef.current.width, 4);
    const normalizedCoordinates = {
      x: limitPrecision(textCoordinates.x/canvasRef.current.width, 4),
      y: limitPrecision(textCoordinates.y / canvasRef.current.height, 4)
    }

    const data = {
      action: "UPDATE_TEMP_TEXT_DATA",
      payload: {
        text: text,
        font: font,
        normalizedFontSize: normalizedFontSize,
        fontColor: fontColor,
        normalizedCoordinates: normalizedCoordinates,
        roomId: currentRoomData.roomId,
        userName: currentUserData.userName
      }
    };

    ws.current.send(JSON.stringify(data));
  }

  const updatePageType = (pageType, ruleColor, ruleHeight) => {

    const data = {
      action: "UPDATE_PAGE_TYPE",
      payload: {
        pageType: pageType,
        ruleColor: ruleColor,
        ruleHeight: ruleHeight,
        roomId: currentRoomData.roomId,
        userName: currentUserData.userName
      }
    }

    ws.current.send(JSON.stringify(data));
  }

  // only sent by the admin to the new user who joins the room
  const sendExistingBoardData = (payload) => {

    console.log("SENDING EXISTING BOARD DATA");
    console.log(pages);

    // send entire pages state and pageIndex
    const data = {
      action: "EXISTING_BOARD_DATA",
      payload: {
        roomId: payload.roomId,
        userName: payload.targetUserName,
        pages: pagesRef.current,
        pageIndex: pageIndex
      }
    }

    ws.current.send(JSON.stringify(data));
  }

  
  useEffect(() => {

    currentRoomDataRef.current = currentRoomData;

    // console.log("-".repeat(10)); 
    // console.log("ROOM DATA CHANGED");
    // console.log(currentRoomData);
    // console.log("-".repeat(10));

  }, [currentRoomData])


  const debounce = (func, delay) => {

    let timer;
    return function(...args) {
      // clearTimeout if the function is called again even before 200ms passed
      clearTimeout(timer);
      // schedule the function to run after 200ms
      timer = setTimeout(() => {
        func.apply(this, args);
      }, delay)
    }

  }


  useEffect(() => {

    let canvas = canvasRef.current

    let dpr = window.devicePixelRatio || 1;

    let rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr; 

    let context = canvas.getContext("2d")

    //context.setTransform(1,0,0,1,0,0);
    //context.scale(dpr, dpr);
    context.lineWidth = 3
    context.lineCap = "round"   // butt or round or square
    context.lineJoin = "round"  // bevel or milter or round

    contextRef.current = context

    // console.log("Client Width: ", canvasRef.current.clientWidth);
    // console.log("Offset Width: ", canvasRef.current.offsetWidth);
    // console.log("Boundind Rect Width: ", canvasRef.current.getBoundingClientRect().width)

    // the server side goes in sleep mode on Render because of inactivity
    // we should send a simple rqeuest to it to wake that up
    // this reduces the room creation time by a few seconds if the server was asleep
    const wakeUpRequest = async () => {
      try {
        const res = await fetch(`${backendURL}/wake-up`);
        const message = await res.json();
        console.log(message);
      }
      catch(err) {
        console.log("Error sending wake up request");
      }
    }

    wakeUpRequest();

    // TO CLOSE THE WEBSOCKET CONNECTION, IF ANY, WHEN COMPONENT UNMOUNTS
    return () => {

      if(ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.close();
        console.log("UNMOUNT...."); 
      }
    }

  }, [])


  // Update paths whenver pages, pageIndex  is modified
  useEffect(() => {

    if(pages.length === 0) {
      setPaths([]);

      // intially we will have an empty new page
      // so that pages[pageIndex] is not undefined
      setPages([[]]);
    }
    else {
      setPaths(pages[pageIndex]);
    }

    // console.log("PAGES");
    // console.log(pages);
    pagesRef.current = pages;

  }, [pages, pageIndex])


  // Call redraw() whenever changes are made to paths variable
  useEffect(() => {

    redraw()

  }, [paths, pageType, ruleColor, ruleHeight])

  useEffect(() => {

    if(currentUserData.isAdmin) {
      console.log("CURRENT USER DATA");
      console.log(currentUserData);
      userIsAdmin.current = true;
    }

  }, [currentUserData])

  // we want to redraw all paths and text as any text properties change
  useEffect(() => {

    redraw()

  }, [font, fontColor, fontSize, text, isAddingText, 
    isTextPositionSelected, textCoordinates])  

  // runs while user in control is adding text. To display same text on others in the room
  useEffect(() => {
    // the redraw function checks whether there is some text or not
    // then displays using displayTempTEXT func
    redraw();

  }, [tempTextData])

  useEffect(() => {

    pageViewRef.current = pageView;

  }, [pageView])


  const openCollaborateModal = () => {
    
    if(collaborateModalRef.current) {
      collaborateModalRef.current.showModal();
      //collaborateModalRef.current.style.opacity = 1;
    }
  } 

  const closeCollaborateModal = () => {

    if(collaborateModalRef.current) {
      collaborateModalRef.current.close();
      //collaborateModalRef.current.opacity = 0;
    }
  }

  const openParticipantsModal = () => {

    if(participantsModalRef.current) {
      //participantsModalRef.current.style.opacity = 1;
      participantsModalRef.current.showModal();
    }
  }

  const closeParticipantsModal = () => {

    if(participantsModalRef.current) {
      //participantsModalRef.current.opacity = 0;
      participantsModalRef.current.close();
    }
  }

  const openConfirmationDialog = () => {

    if(confirmationDialogRef.current) {
      confirmationDialogRef.current.showModal();
      //confirmationDialogRef.current.style.opacity = 1;
    }
  }

  const closeConfirmationDialog = () => {

    if(confirmationDialogRef.current) {
      confirmationDialogRef.current.close();
      //confirmationDialogRef.current.style.opacity = 0;
    }
  }


  return (
    <div className="container"> 
      <div className="title">
          <p>Blueprint</p>
          {pageView === "home" ? 
            <button className="collaborate-button" 
              onClick={() => openCollaborateModal()}>
              <p>Collab</p>
              <span className="material-symbols-outlined">
                groups_2
              </span>
            </button>
            :
            <button className="leave-room-button" 
              onClick={leaveRoom}>
              <p>Leave</p>
              <span className="material-symbols-outlined">
                logout
              </span>
            </button>
          }
          
      </div>


      {/*Modal to open when collab button clicked */}
      <CollaborateModal userName={userName} setUserName={setUserName} 
      createRoom={createRoom} roomId={roomId} setRoomId={setRoomId} 
      joinRoom={joinRoom} closeCollaborateModal={closeCollaborateModal}
      collaborateError={collaborateError} collaborateModalRef={collaborateModalRef}
      createLoading={createLoading} joinLoading={joinLoading} />

      {/* Modal to show participants and handle various controls */}
      <ParticipantsModal currentRoomData={currentRoomData} currentUserData={currentUserData}
      closeParticipantsModal={closeParticipantsModal} 
      participantsModalRef={participantsModalRef}
      setConfirmationDialogMessage={setConfirmationDialogMessage}
      setConfirmationDialogType={setConfirmationDialogType}
      setConfirmationDialogUserName={setConfirmationDialogUserName}
      openConfirmationDialog={openConfirmationDialog} />

      {/* Confirmation dialog to appear when participant is being disabled or removed */}
      <ConfirmationDialog confirmationDialogMessage={confirmationDialogMessage} 
      confirmationDialogRef={confirmationDialogRef} 
      closeConfirmationDialog={closeConfirmationDialog} 
      confirmationDialogType={confirmationDialogType} 
      confirmationDialogUserName={confirmationDialogUserName} 
      currentRoomData={currentRoomData} currentUserData={currentUserData}
      pageIndex={pageIndex}
      ws={ws} />
      

      {pageView === "room" && 
        <div className="room-info">
          <div className="in-control">
            <p>In control: </p>
            <span>{boardLock.userName}{boardLock.isFocused ? ` (${boardLock.mode})` : ""}</span>
          </div>
          <div className="participants-button">
            <button id="copy-room-id" onClick={copyRoomId}>
              Room ID
              <span className="material-symbols-outlined">
                content_copy
              </span>
            </button>
            <button onClick={openParticipantsModal}>
              View Participants ({currentRoomData.users?.length})
            </button>
          </div>
        </div>
      }


      <div className="top">

            {
            (currentUserData.isDisabled) ?
              (<UserDisabled currentUserData={currentUserData} 
                currentRoomData={currentRoomData} ws={ws} />)
            :
            (selectedTool === "pen") ?

              (<PenToolSelected selectedSize={selectedSize} selectedOpacity={selectedOpacity} 
              selectedColor={selectedColor} selectedType={selectedType} 
              toolsHandler={toolsHandler} />)
            :
            (selectedTool === "text" && !isTextPositionSelected) ?

              (<div className="select-a-position">
                Select a position
              </div>)
            :
            (selectedTool === "text" && isTextPositionSelected) ?

              (<TextToolSelected fontSize={fontSize} fontColor={fontColor} font={font} text={text}
              validFontSizes={validFontSizes} toolsHandler={toolsHandler} />)
            :
            (selectedTool === "page-type") ?

              (<PageTypeToolSelected pageType={pageType} ruleColor={ruleColor} 
              ruleHeight={ruleHeight} toolsHandler={toolsHandler} />)
            :
            (selectedTool === "shape-detection") ?

              (<div className="shape-detection-tool">
                Automatic shape detection is not yet functional
              </div>)
            :
            (selectedTool === "eraser") ?
              <EraserToolSelected />
            :
            (selectedTool === null) ?

              (<div className="no-tool">
                <p>Select a tool</p>
              </div>)
            :
            null
            }
      </div>

      <div className="bottom">
            <canvas
                  ref={canvasRef}
                  onMouseDown={(e) => handleMouseDown(e)}
                  onMouseMove={(e) => handleMouseMove(e)}
                  onMouseUp={() => finishDrawing()}
                  onTouchStart={(e) => handleMouseDown(e)}
                  onTouchMove={(e) => handleMouseMove(e)}
                  onTouchEnd={finishDrawing}
                  onTouchCancel={() => handleMouseOut()}
                  onMouseOut={() => handleMouseOut()} // Stop drawing when pen/pencil moves out of the canvas
                  className={selectedTool === "pen" ? "pen" : selectedTool === "eraser" ? "eraser" :
                    selectedTool === "text" ? "text" : selectedTool === "page-type" ? "page-type" : ""
                  }
                >
            </canvas>

            {/* ok and cancel buttons when adding text */}
            {(isAddingText && isTextPositionSelected )&& 

            <div className="top-right">
              <button id="confirm-text" onClick={addText}>
                <span className="material-symbols-outlined">
                  check
                </span> 
              </button>
              <button id="cancel-text" onClick={cancelText}>
                <span className="material-symbols-outlined">
                  close
                </span>
              </button>
            </div>
            }
            

            {/* Page indication and new page functionality */}
            <div className="bottom-right">
                <div className="page-indicator">
                  <p>{`${pageIndex + 1} / ${pages?.length}`}</p>
                  <div className='increment-decrement'>
                    <button disabled={currentUserData.isDisabled ? true :
                      pageIndex === (pages?.length - 1) ? true : false}
                      onClick={() => handleNextSlide()}>
                      <span className="material-symbols-outlined">
                        keyboard_arrow_up
                      </span>
                    </button>
                    <button 
                    disabled={currentUserData.isDisabled ? true :
                      pageIndex === 0 ? true : false}
                      onClick={() => handlePrevSlide()}>
                      <span className='material-symbols-outlined'>
                        keyboard_arrow_down
                      </span>
                    </button>
                </div>
                </div>
                <button className="add-page" onClick={handleAddPage}
                disabled={currentUserData.isDisabled ? true : 
                pages.length >= 9 ? true : false}>
                  <span className="material-symbols-outlined">
                    add
                  </span>
                </button>
            </div>

            <Tools selectedTool={selectedTool} canUndo={canUndo} canRedo={canRedo} handleUndo={handleUndo} 
              handleRedo={handleRedo} clearCanvas={clearCanvas}
              saveCanvas={saveCanvas} paths={paths}
              toolsHandler={toolsHandler}
              currentUserData={currentUserData}
              isAddingText={isAddingText}
              />
      </div>

      {/* <button onClick={openParticipantsModal}>
        Click
      </button> */}
    </div>
  );
}

export default Main;
