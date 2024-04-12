import React from "react";
import '../style/keyboard.css';

// Individual Key component for on-screen keyboard

function Key({ value, isActive }){
    return (
        <div className={isActive ? "keyboard-key active" : "keyboard-key"}>
            {value}
        </div>
    );
}

export default Key;