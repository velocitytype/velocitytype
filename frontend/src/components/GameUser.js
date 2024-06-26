import React from "react";

//GameUser is the user data shown while the game has not started
function User({username, status, host}){
    return (
        <div className="game-user">
            <span id="username">{username}{host ? " (Host)" : ""}</span>
            <span className={status ? "user-status-ready" : "user-status-not-ready"}>{status ? "Ready" : "Not Ready"}</span>
        </div>
    )
}

export default User;