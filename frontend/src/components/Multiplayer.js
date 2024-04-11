import React, {useState, useEffect, useRef, useContext} from "react";
import { io } from 'socket.io-client';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../style/multiplayer.css';
import GameInput from "./GameInput";
import { SocketContext } from "./SocketContext";
import User from "./GameUser";
import {useNavigate} from "react-router-dom";

function Multiplayer({textInputRef, handleInputFocus}){
    const socket = useContext(SocketContext)
    const roomIdRef = useRef(null)
    const usernameRef = useRef(null)
    const [roomJoined, setRoomJoined] = useState(false)
    const [users, setUsers] = useState([])
    const [isReady, setIsReady] = useState(false)
    const [username, setUsername] = useState("")
    const [roomHost, setRoomHost] = useState(false)
    const [roomId, setRoomId] = useState(null)
    const [words, setWords] = useState([])
    const [mode, setMode] = useState("words")
    const [limit, setLimit] = useState(15)
    const [gameStarted, setGameStarted] = useState(false)
    const navigate = useNavigate()
    const handleJoin = () => {
        const roomId = roomIdRef.current.value;
        const username = usernameRef.current.value;
        if (roomId === "" || username === "" || !roomId || !username){
            return;
        }
        setUsername(username)
        setRoomId(roomId)
        socket.emit("join-room", {"roomId": roomId, "username": username})
        setRoomJoined(true)
    }

    socket.on("room-joined", (data) => {
        setUsers(data.users)
    })

    socket.on("room-host", (data) => {
        setIsReady(true)
        setRoomHost(true)
    })

    socket.on("user-ready", (data) => {
        setUsers(data.users)
    })

    const handleReady = () => {
        socket.emit("ready", {"roomId": roomId, "username": username})
    }

    const startGame = () => {
        socket.emit("game-start", {"roomId": roomId, "mode": mode, "limit": limit})
    }
    socket.on("user-not-ready", (data) => {
        toast.error(data.message)
    })

    socket.on("game-started", (data) => {
        setWords(data.words)
        setGameStarted(true)
    })

    socket.on("room-left", (data) => {
        setUsers(data.users)
    })
    const endGame = () => {
        socket.emit("end-room", {"roomId": roomId})
    }

    const handleLeave = () => {
        socket.emit("leave-room", {"roomId": roomId, "username": username})
        toast.warning("Room ended")
        socket.close()
        window.location.reload()
    }
    socket.on("room-ended", () => {
        console.log("HERE")
        socket.close()
        window.location.reload()
    })
    return ( 
        <>
            {!roomJoined ?
                <div className="room-inputs-wrapper">
                    <div className="game-header">
                        <h1>VelocityType Multiplayer</h1>
                    </div>
                    <div className="room-inputs">
                        <input ref={roomIdRef} placeholder="Room Code" />
                        <input ref={usernameRef} placeholder="Username" />
                        <button onClick={handleJoin}>Join/Create Room</button>
                    </div>
                </div>
            : !gameStarted ?
                <div className="room-details-wrapper">
                    <div className="room-joined-text">
                        <span>Room Joined | {roomId}</span>
                    </div>
                    {roomHost ? <div className="room-config-wrapper">
                        <div className="game-mode-config">
                            <h3>Current Mode:</h3>
                            <div className="game-mode-options">
                                <span onClick={() => setMode("words")} className={mode === "words" ? "game-mode-active" : "game-mode"}>Words</span>
                                <span onClick={() => setMode("time")} className={mode === "time" ?"game-mode-active" : "game-mode"}>Time</span>
                            </div>
                        </div>
                        <div className="game-limit-config">
                            <h3>Current Limit:</h3>
                            <div className="game-limit-options">
                                <span onClick={() => setLimit(15)} className={limit === 15 ? "game-mode-active" : "game-mode"}>15</span>
                                <span onClick={() => setLimit(30)} className={limit === 30 ?"game-mode-active" : "game-mode"}>30</span>
                                <span onClick={() => setLimit(60)} className={limit === 60 ?"game-mode-active" : "game-mode"}>60</span>
                                <span onClick={() => setLimit(90)} className={limit === 90 ?"game-mode-active" : "game-mode"}>90</span>
                            </div>
                        </div>
                    </div> : ""}
                    
                    <div className="room-users">
                        <span id="users-joined">Users Joined</span>
                        <div className="room-users-list">
                            {
                                [...Array.from(users.map(i => {
                                    return (
                                        <User username={i[0]} status={i[1]} host={i[2]}/>
                                    )
                                }))]
                            }
                        </div>
                    </div>
                    <div className="start-button-wrapper">
                            {
                                roomHost ? <button onClick={startGame}>Start</button> : <button onClick={handleReady}>Ready</button>
                            }
                            {
                                roomHost ? <button onClick={endGame}>End</button> : <button onClick={handleLeave}>Leave</button>
                            }
                    </div>
                </div>
            : <GameInput textInputRef={textInputRef} handleInputFocus={handleInputFocus} limitStart={limit} words={words} roomId={roomId} username={username} mode={mode}/>
            }
            <ToastContainer position="top-right" autoClose={2500} hideProgressBar={false} newestOnTop={true} closeOnClick rtl={false} pauseOnHover theme="dark"/>
        </>
    )
}

export default Multiplayer;