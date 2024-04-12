import React from "react";
import Header from "./Header";
import '../style/notfound.css';

// 404 not found
function NotFound(){
    return (
        <>
            <Header />
            <div className="not-found-wrapper">
                <h1>404 - Page not found</h1>
            </div>
        </>
    )
}

export default NotFound;