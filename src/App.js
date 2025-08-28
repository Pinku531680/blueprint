import React, {useState, useEffect, useRef} from "react"
import "./App.css"
import Training from "./others/training";
import Main from "./Main"


function useWindowWidth() {

  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {

    function handleResize() {
      setWidth(window.innerWidth);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [])

  return width;
}

function App() {

  const [chartsPage, setChartsPage] = useState(false);

  const width = useWindowWidth();
  const isSmallScreen = width <= 720;

  if(isSmallScreen) {
    return (
      <div className="small-screen">
        This application is made for larger screens!
      </div>
    )
  }

  return (
    <div>
      <Main />
    </div>
  )
}

export default App;
