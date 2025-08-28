import React, {useState, useEffect, useRef} from 'react'
import "./PenToolSelected.css";


function PenToolSelected({selectedSize, selectedColor, selectedOpacity, 
  selectedType, toolsHandler 
}) {

  // All available colors (constant)
  const colorPalette = [
    "#121212", "#fa4848", "#2d95fc", "#4fc2f7",
    "#26ed34", "#74fc58", "#9d9d9dff", "#ddb608ff",
    "#fc4ec2", "#fc8844", "#7c46fa", "#96424b"
  ]

  // All available pen types
  const penTypes = ["Regular", "Dashed", "Dotted"];

  const activeType = "Regular";

  // For color palette
  const [paletteOpened, setPaletteOpened] = useState(false);
  const paletteRef = useRef(null);
  const paletteButtonRef = useRef(null);

  // For types
  const [typesOpened, setTypesOpened] = useState(false);
  const typesRef = useRef(null);
  const typesButtonRef = useRef(null);

  // onClick on each color

  // toolsHandler.colorSelect(colorHexCode)
  // made changes in Main JS as well to handle this

  useEffect(() => {

    const handleClickOutside = (e) => {

      // this if statement makes sure that
      // our mouse click is not inside the palette 
      // and not inside the arrow button
      // If the mouse click is outside these 2 spaces
      // then we want to close the color palette
      if(paletteRef.current && 
        !paletteRef.current.contains(e.target) && 
        paletteButtonRef.current && 
        !paletteButtonRef.current.contains(e.target))
      { 
        setPaletteOpened(false);
        console.log("CLICKED OUTSIDE!");
      }

      // doing the same for types menu
      if(typesRef.current && 
        !typesRef.current.contains(e.target) && 
        typesButtonRef.current &&
        !typesButtonRef.current.contains(e.target)
      ) {
        setTypesOpened(false);
        console.log("Clicked Outside");
      }
    }

    // add the event listener when the palette is open
    if(paletteOpened) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // add event listener when types menu is open
    if(typesOpened) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // cleanup function to remove the event listener when palette closes
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    }

  })

  return (
        <ul className="pen-tool">
            <li className="size">
              <p>Size </p>
              <div className="size-selector">
                <p className='current-size'>{selectedSize}</p>
                <div className='increment-decrement'>
                  <button disabled={selectedSize === 5 ? true : false}
                    onClick={() => toolsHandler.sizeSelect(selectedSize + 1)}>
                      <span className="material-symbols-outlined">
                        keyboard_arrow_up
                      </span>
                  </button>
                  <button disabled={selectedSize === 1 ? true : false}
                    onClick={() => toolsHandler.sizeSelect(selectedSize - 1)}>
                      <span className='material-symbols-outlined'>
                        keyboard_arrow_down
                      </span>
                  </button>
                </div>
              </div>
            </li>

            <li className="colors">
              <p>Color </p>
              <div className='color-selector'>
                    <span className='active-color' 
                      style={{background: selectedColor}}>
                    </span>
                    <button onClick={() => {
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
                            toolsHandler.colorSelect(color);
                          }}
                          style={{background: color}} key={index}>
                            {selectedColor === color &&
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

            <li className="opacity">
                <p>Opacity </p>
                <div className="opacity-selector">
                  <p className='current-opacity'>
                    {selectedOpacity === 1 ? "1.0" : selectedOpacity}
                  </p>
                  <div className='increment-decrement'>
                    <button disabled={selectedOpacity === 1 ? true : false}
                      onClick={() => toolsHandler.opacitySelect(selectedOpacity + 0.1)}>
                      <span className="material-symbols-outlined">
                        keyboard_arrow_up
                      </span>
                    </button>
                    <button disabled={selectedOpacity === 0.1 ? true : false}
                      onClick={() => toolsHandler.opacitySelect(selectedOpacity - 0.1)}>
                      <span className='material-symbols-outlined'>
                        keyboard_arrow_down
                      </span>
                    </button>
                  </div>
                </div>
            </li>
              
            <li className="types">
                <p>Type </p>
                <div className='type-selector'>
                  <p className='active-type'>
                    {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}
                  </p>
                  <button onClick={() => setTypesOpened(prevState => !prevState)}
                    ref={typesButtonRef}>
                      <span className={typesOpened ? "material-symbols-outlined opened" :
                        "material-symbols-outlined"
                      }
                      >
                        arrow_drop_down
                      </span>
                  </button>


                  <div className={typesOpened ? "types-menu" : 
                            "types-menu-hidden"}
                      ref={typesRef}>
                        {penTypes.map((type, index) => {
                        return (
                          <div className={selectedType.toLowerCase() === type.toLowerCase() ? 
                            "pen-type selected-pen-type" : "pen-type"
                          }
                          onClick={() => {
                          toolsHandler.typeSelect(type.toLowerCase());
                          // close the menu as well
                          setTypesOpened(false);
                          }}
                          key={index}>
                            {type}
                          </div>
                        )
                      })}
                  </div>

                </div>
            </li>
          </ul> 
  )
}

export default PenToolSelected