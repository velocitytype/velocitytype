import React from "react";
import Key from "./Key";
import '../style/keyboard.css';

// This is the on screen keyboard component

function Keyboard({isActive, currKey}){
    return (
        <div className={isActive ? "keyboard" : "keyboard inactive"}>
            <div className="keyboard-row">
                <Key value="q" isActive={currKey === "q"} />
                <Key value="w" isActive={currKey === "w"} />
                <Key value="e" isActive={currKey === "e"} />
                <Key value="r" isActive={currKey === "r"} />
                <Key value="t" isActive={currKey === "t"} />
                <Key value="y" isActive={currKey === "y"} />
                <Key value="u" isActive={currKey === "u"} />
                <Key value="i" isActive={currKey === "i"} />
                <Key value="o" isActive={currKey === "o"} />
                <Key value="p" isActive={currKey === "p"} />
                <Key value="[" isActive={currKey === "["} />
                <Key value="]" isActive={currKey === "]"} />
            </div>
            <div className="keyboard-row">
                <Key value="a" isActive={currKey === "a"} />
                <Key value="s" isActive={currKey === "s"} />
                <Key value="d" isActive={currKey === "d"} />
                <Key value="f" isActive={currKey === "f"} />
                <Key value="g" isActive={currKey === "g"} />
                <Key value="h" isActive={currKey === "h"} />
                <Key value="j" isActive={currKey === "j"} />
                <Key value="k" isActive={currKey === "k"} />
                <Key value="l" isActive={currKey === "l"} />
                <Key value=";" isActive={currKey === ";"} />
                <Key value="'" isActive={currKey === "'"} />
            </div>
            <div className="keyboard-row">
                <Key value="z" isActive={currKey === "z"} />
                <Key value="x" isActive={currKey === "x"} />
                <Key value="c" isActive={currKey === "c"} />
                <Key value="v" isActive={currKey === "v"} />
                <Key value="b" isActive={currKey === "b"} />
                <Key value="n" isActive={currKey === "n"} />
                <Key value="m" isActive={currKey === "m"} />
                <Key value="," isActive={currKey === ","} />
                <Key value="." isActive={currKey === "."} />
                <Key value="/" isActive={currKey === "/"} />
            </div>
            <div className="keyboard-row">
                <Key value="space" isActive={currKey === " "} />
            </div>
        </div>
    )
}

export default Keyboard;