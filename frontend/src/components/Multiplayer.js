import React, {useState, useEffect, useRef, useContext} from "react";
import { io } from 'socket.io-client';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../style/multiplayer.css';
import GameInput from "./GameInput";
import { SocketContext } from "./SocketContext";
import User from "./GameUser";

// This is the interface for game/multiplayer mode

function Multiplayer({textInputRef, handleInputFocus}){
    // socket object to communicate to the server and emit events
    const socket = useContext(SocketContext)
    // current roomId input's reference
    const roomIdRef = useRef(null)
    // current username input's reference
    const usernameRef = useRef(null)
    // the user has joined a room or not
    const [roomJoined, setRoomJoined] = useState(false)
    // set the users in the connected room
    const [users, setUsers] = useState([])
    // states if the user is ready or not
    const [isReady, setIsReady] = useState(false)
    // username of the current user
    const [username, setUsername] = useState("")
    // is the user the host of the room?
    const [roomHost, setRoomHost] = useState(false)
    // current room id
    const [roomId, setRoomId] = useState(null)
    // words that will be used in the test, same for all clients
    const [words, setWords] = useState([])
    // current game mode (words/time)
    const [mode, setMode] = useState("words")
    // current game limit (15/30/60/90)
    const [limit, setLimit] = useState(15)
    // has the game started?
    const [gameStarted, setGameStarted] = useState(false)

    // joins the room with given room id and username
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

    // whenever someone joins the room, update the users, mode and limit
    socket.on("room-joined", (data) => {
        setUsers(data.users)
        setMode(data.mode)
        setLimit(data.limit)
    })

    // if the user is the host, set room host to true, to toggle config
    socket.on("room-host", (data) => {
        setIsReady(true)
        setRoomHost(true)
    })

    // whenever a user is ready, update users data
    socket.on("user-ready", (data) => {
        setUsers(data.users)
    })

    // emits ready event so all clients know this user is ready
    const handleReady = () => {
        socket.emit("ready", {"roomId": roomId, "username": username})
    }

    // emits game-start that starts the game
    const startGame = () => {
        socket.emit("game-start", {"roomId": roomId, "mode": mode, "limit": limit})
    }
    
    // if all users are not ready, game can not be started
    socket.on("user-not-ready", (data) => {
        toast.error(data.message)
    })

    // on game started, set the words received from the server
    socket.on("game-started", (data) => {
        setWords(data.words)
        setGameStarted(true)
    })

    // whenever someone left room, update users

    socket.on("room-left", (data) => {
        setUsers(data.users)
    })

    // end the room/ game
    const endGame = () => {
        socket.emit("end-room", {"roomId": roomId})
    }

    // emits leave-room telling the user wants to leave
    const handleLeave = () => {
        socket.emit("leave-room", {"roomId": roomId, "username": username})
        toast.warning("Room ended")
        socket.close()
        window.location.reload()
    }
    // on room end, close connection
    socket.on("room-ended", () => {
        socket.close()
        window.location.reload()
    })

    // on game config changed, set the new config
    socket.on("game-config-changed", (data) => {
        setMode(data.mode)
        setLimit(data.limit)
    })

    // whenever mode, limit changes emit change-game-config telling the server to change the config
    useEffect(() => {
        socket.emit("change-game-config", {"roomId": roomId, "mode": mode, "limit": limit})
    }, [mode, limit])
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