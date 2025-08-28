import React, {useEffect} from 'react'


function Tools({selectedTool, canUndo, canRedo, handleUndo, handleRedo,
    clearCanvas, saveCanvas, paths, toolsHandler, currentUserData, isAddingText
}) {


  return (
    <div className='bottom-left'>
        <ul className="tools">
            <li id="pen" 
            className={currentUserData.isDisabled ? "tool disabled" : 
              selectedTool === 'pen' ? 'tool selected' : 'tool'}
              onClick={() => toolsHandler.toolSelect("pen")}>
              {/* <i className="fa-solid fa-pencil"></i> */}
              <span className='material-symbols-outlined'>
                stylus_note
              </span>
            </li>
            <li id="text" 
            className={currentUserData.isDisabled ? "tool disabled" :
              selectedTool === 'text' ? 'tool selected' : 'tool'}
              onClick={() => toolsHandler.toolSelect("text")}>
              {/* <i className="fa-solid fa-font"></i> */}
              <span className='material-symbols-outlined'>
                text_fields
              </span>
            </li>
            <li id="page-type" 
            className={currentUserData.isDisabled ? "tool disabled" : 
              selectedTool === 'page-type' ? 'tool selected' : 'tool'}
              onClick={() => toolsHandler.toolSelect("page-type")}>
              <span className='material-symbols-outlined'>
                  texture
              </span>
            </li>
            <li id="shape-detection" 
            className={currentUserData.isDisabled ? "tool disabled" : 
              selectedTool === 'shape-detection' ? 'tool selected' : 'tool'}
              onClick={() => toolsHandler.toolSelect("shape-detection")}>
              <span className='material-symbols-outlined'>
                category
              </span>
            </li>
            <li id="eraser" 
            className={currentUserData.isDisabled ? "tool disabled" :
              selectedTool === 'eraser' ? 'tool selected' : 'tool'}
              onClick={() => toolsHandler.toolSelect("eraser")}>
              {/* <i className="fa-solid fa-eraser"></i> */}
              <span className='material-symbols-outlined'>
                ink_eraser
              </span>
            </li>
            <li id="undo" 
            className={currentUserData.isDisabled ? "tool disabled" :
              canUndo() === false ? "tool disabled" : "tool"}
              onClick={handleUndo}>
              {/* <i className="fa-solid fa-rotate-left"></i> */}
              <span className='material-symbols-outlined'>
                undo
              </span>
            </li>
            <li id="redo" 
            className={currentUserData.isDisabled ? "tool disabled" :
              canRedo() === false ? "tool disabled" : "tool"}
              onClick={handleRedo}>
              {/* <i className="fa-solid fa-rotate-right"></i> */}
              <span className='material-symbols-outlined'>
                redo
              </span>
            </li>
            <li id="clear" className={currentUserData.isDisabled ? "tool disabled" : 
            paths?.length === 0 ? "tool disabled" : isAddingText ? "tool disabled" : "tool"}
              onClick={clearCanvas}>
              {/* <i className="fa-solid fa-ban"></i> */}
              <span className='material-symbols-outlined'>
                cleaning_services
              </span>
            </li> 
            <li id="download" 
            className={currentUserData.isDisabled ? "tool disabled" :
              paths?.length === 0 ? "tool disabled" : "tool"}
              onClick={saveCanvas}>
              {/* <i className="fa-solid fa-download"></i> */}
              <span className='material-symbols-outlined'>
                  download
              </span>
            </li>
        </ul>
    </div>
  )
}

export default Tools