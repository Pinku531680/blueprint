import React, {useState, useEffect, useRef} from "react";
import "./PageTypeToolSelected.css";


function PageTypeToolSelected({pageType, ruleColor, ruleHeight, toolsHandler}) {

  // All available colors (constant)
  const colorPalette = [
    "#121212", "#fa4848", "#2d95fc", "#4fc2f7",
    "#26ed34", "#74fc58", "#9d9d9dff", "#ddb608ff",
    "#fc4ec2", "#fc8844", "#7c46fa", "#96424b"
  ]

  // available line heights 
  // 20, 30, 40, 45, 50, 55, 60, 65, 70

  // For color palette
  const [paletteOpened, setPaletteOpened] = useState(false);
  const paletteRef = useRef(null);
  const paletteButtonRef = useRef(null);

  useEffect(() => {

    // function to handle click outside the color palette
    // in order to close it
    const handleClickOutside = (e) => {

      if(!paletteRef.current.contains(e.target) && 
          !paletteButtonRef.current.contains(e.target)
        ) 
      {
        setPaletteOpened(false);
      }
    
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    }

  }, [])


  return (
    <ul className="page-type">
      <li className="type">
        <p>Page Type </p>
        <div className="type-selector">
          {/* This will be a toggle switch kind of option */}
          <span className={pageType === "plain" ? "page-type selected" : "page-type"}
          onClick={() => toolsHandler.pageTypeSelect("plain")}>
            Plain
          </span>
          <span className={pageType === "ruled" ? "page-type selected" : "page-type"}
          onClick={() => toolsHandler.pageTypeSelect("ruled")}>
            Ruled
          </span>
        </div>
      </li>

      <li className="rule-color">
        <p>Rule Color </p>
        <div className={pageType === "ruled" ? "color-selector" : 
                        "color-selector disabled"}>
            <span className='active-color' 
              style={{background: ruleColor}}>
            </span>
            <button onClick={() => {
              // if "plain" type selected, do nothing
              if(pageType === "plain") return;

              setPaletteOpened(prevState => !prevState);
            }}
            ref={paletteButtonRef}>
              <span className={
                paletteOpened ? "material-symbols-outlined opened" : 
                "material-symbols-outlined"
              } >
                arrow_drop_down
              </span>
            </button>
            
            {/* Color Palette Div */}
            <div className={paletteOpened ? "color-palette" : 
                        "color-palette-hidden"}
                ref={paletteRef}>
                {colorPalette.map((color, index) => {
                  return (
                  <div className="palette-color"
                    onClick={() => {
                      toolsHandler.ruleColorSelect(color);
                    }}
                    style={{background: color}} key={index}>
                    {ruleColor === color &&
                        <span className='material-symbols-outlined'>
                          check
                        </span>
                    }
                  </div>
                  )
              })}
            </div>  
        </div>
      </li>

      <li className="line-height">
          <p>Line height </p>
          <div className={pageType === "ruled" ? "line-height-selector":
                          "line-height-selector disabled"}>
              <p className="current-line-height">
                {ruleHeight} px
              </p>
              <div className='increment-decrement'>
                  <button disabled={ruleHeight === 70 ? true : false}
                    onClick={() => {
                      // if "plain" type selected, do nothing
                      if(pageType === "plain") return;

                      toolsHandler.ruleHeightSelect(ruleHeight + 10)
                    }}>
                    <span className="material-symbols-outlined">
                      keyboard_arrow_up
                    </span>
                  </button>
                  <button disabled={ruleHeight === 20 ? true : false}
                    onClick={() => {
                      // if "plain" type selected, do nothing
                      if(pageType === "plain") return;

                      toolsHandler.ruleHeightSelect(ruleHeight - 10)
                    }}>
                    <span className='material-symbols-outlined'>
                      keyboard_arrow_down
                    </span>
                  </button>
              </div>
          </div>
      </li>
    </ul>
  )
}

export default PageTypeToolSelected



