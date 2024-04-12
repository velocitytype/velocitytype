import React from "react";
import '../style/profile.css';

// This shows the result of a test, used in profile page of a user
function Result({testMode, testLimit, testWpm, testAccuracy}){
    return (
        <div className="result">
            <span className="test-mode">{testMode} {testLimit}</span>
            <span className="test-wpm">{testWpm}</span>
            <span className="test-accuracy">{testAccuracy}{testAccuracy === "-" ? "" : "%"}</span>
        </div>
    )
}

export default Result;