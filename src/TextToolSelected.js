import React, {useState, useEffect, useRef} from 'react'
import "./TextToolSelected.css";


function TextToolSelected({fontSize, fontColor, font, text, validFontSizes, toolsHandler}) {

    // All available colors (constant)
    const colorPalette = [
    "#121212", "#fa4848", "#2d95fc", "#4fc2f7",
    "#26ed34", "#74fc58", "#9d9d9dff", "#ddb608ff",
    "#fc4ec2", "#fc8844", "#7c46fa", "#96424b"
    ]

    const fonts = [
        "Poppins", "Newsreader", "Montserrat", "Alata", 
        "Caveat", "Quicksand", "Indie Flower"
    ]

    const respectiveDisplaySize = {
      "Poppins": 16,
      "Newsreader": 17,
      "Montserrat": 16,
      "Alata": 16,
      "Caveat": 20,
      "Quicksand": 16,
      "Indie Flower": 19
    }

    // For color palette
    const [paletteOpened, setPaletteOpened] = useState(false);
    const paletteRef = useRef(null);
    const paletteButtonRef = useRef(null);

    // for font type
    const [fontTypesOpened, setFontTypesOpened] = useState(false);
    const fontTypesRef = useRef(null);
    const fontTypesButtonRef = useRef(null);


    useEffect(() => {

      const handleClickOutside = (e) => {
        // to close the color palette when clicked outside somewhere

        if(paletteRef.current && 
          !paletteRef.current.contains(e.target) && 
          paletteButtonRef.current && 
          !paletteButtonRef.current.contains(e.target))
        {
          setPaletteOpened(false);
        }   
        
        if(fontTypesRef.current &&
          !fontTypesRef.current.contains(e.target) &&
          fontTypesButtonRef.current &&
          !fontTypesButtonRef.current.contains(e.target)
        )
        {
          setFontTypesOpened(false);
        }
      }

      document.addEventListener("mousedown", handleClickOutside);

      return () => {
          document.removeEventListener("mousedown", handleClickOutside);
      }

    }, [])


  return ( 
        <ul className="text-tool">
            <li className='text-box'>
                <input placeholder='Type here...' value={text} 
                onChange={(e) => {
                  toolsHandler.textSelect(e.target.value)
                }}/>
            </li>

            <li className='font-size'>
                <p>Size </p>
                <div className="size-selector">
                    <p className='current-size'>{fontSize}</p>
                    <div className='increment-decrement'>
                    <button disabled={fontSize === validFontSizes.at(-1) ? true : false}
                    onClick={() => {
                      // set the fontSize to the just greater font size in the validFontSizes arr
                      const justGreaterSizeIndex = validFontSizes.indexOf(fontSize) + 1; 
                      toolsHandler.fontSizeSelect(validFontSizes[justGreaterSizeIndex]);
                    }}>
                      <span className="material-symbols-outlined">
                        keyboard_arrow_up
                      </span>
                    </button>
                    <button disabled={fontSize === validFontSizes[0] ? true : false}
                    onClick={() => {
                      // here we want just smaller font size from validFontSizea arr
                      const justSmallerSizeIndex = validFontSizes.indexOf(fontSize) - 1;
                      toolsHandler.fontSizeSelect(validFontSizes[justSmallerSizeIndex]);
                    }}>
                      <span className='material-symbols-outlined'>
                        keyboard_arrow_down
                      </span>
                    </button>
                    </div>
                </div>
            </li>

            <li className='font-color'>
                <p>Color </p>
                <div className='color-selector'>
                    <span className='active-color' 
                      style={{background: fontColor}}>
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
                            toolsHandler.fontColorSelect(color);
                          }}
                          style={{background: color}} key={index}>
                            {fontColor === color &&
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

            <li className="font" >
                <p>Font </p>
                <div className='font-selector'>
                    <p className='active-font'
                    style={{fontFamily: `${font}, "sans-serif`,
                            fontSize: respectiveDisplaySize[font]}}>
                    {font.charAt(0).toUpperCase() + font.slice(1)}
                    </p>
                    <button onClick={() => {
                      setFontTypesOpened(prevState => !prevState);
                    }}
                    ref={fontTypesButtonRef}>
                      <span className={fontTypesOpened ? "material-symbols-outlined opened" :
                        "material-symbols-outlined"
                      }
                      >
                        arrow_drop_down
                      </span>
                    </button>


                    <div className={fontTypesOpened ? "font-menu" : "font-menu-hidden"}
                      ref={fontTypesRef}>
                        {fonts.map((type, index) => {
                        return (
                          <div className={font.toLowerCase() === type.toLowerCase() ? 
                            "font-type selected-font-type" : "font-type"
                          }
                          onClick={() => {
                            toolsHandler.fontSelect(type);
                          }}
                          key={index}>
                            <p style={{
                              fontFamily: `"${type}", sans-serif`,
                              fontSize: respectiveDisplaySize[type]}}>
                              {type}
                            </p>                          
                          </div>
                        )
                      })}
                    </div>
                </div>
            </li>


        </ul>
  )
}

export default TextToolSelected;