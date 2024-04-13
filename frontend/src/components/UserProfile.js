import React, {useState, useEffect} from "react";
import Header from "./Header";
import Result from "./Result";
import '../style/profile.css';
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Dialog, DialogTitle } from "@mui/material";

// This is the profile page of a user
function UserProfile(){
    // set userData to null initially
    const [userData, setUserData] = useState(null)
    // initialize best wpm data
    const [wpmData, setWpmData] = useState({
        "words 15": ["-", "-"],
        "words 30": ["-", "-"],
        "words 60": ["-", "-"],
        "words 90": ["-", "-"],
        "time 15": ["-", "-"],
        "time 30": ["-", "-"],
        "time 60": ["-", "-"],
        "time 90": ["-", "-"],
    })
    const navigate = useNavigate();

    // on load, fetch the profile data from the server
    useEffect(() => {
        fetch("http://127.0.0.1:5000/profile", {
            credentials: "include",
        })
        .then(res => res.json())
        .then(data => {
            const tempWpmData = wpmData
            var c = 0;
            data["best_wpm"].forEach(i => {
                const testMode = i[1]
                const testLimit = i[2]
                tempWpmData[`${testMode} ${testLimit}`] = [i[3], i[4]]
                c += 1;
                if (c === data["best_wpm"].length){
                    setWpmData(tempWpmData)
                }
            })
            // if the length is not 4, fill it upto 4
            if (data["recent_tests"].length !== 4){
                let rem = 4 - data["recent_tests"].length;
                for(let i=0;i<rem;i++){
                    data["recent_tests"].push(["-", "-", "-", "-"])
                }
            }
            setUserData(data)
        })
        .catch(e => toast.error(e.toString()))
    }, [])

    // logouts user
    function handleLogout(){
        window.localStorage.setItem("vt_login", "false")
        navigate("/")
    }

    const [qr, setQr] = useState(null)
    const [dialog, setDialog] = useState(false)
    const [enabled, setEnabled] = useState(false)

    const handleKeyDown = (e) => {
        if (e.keyCode === 27) {
            setDialog(false)
        }
    }
    useEffect(() => {
        if (dialog === true){
            fetch("http://127.0.0.1:5000/profile", {
                credentials: "include",
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({"2fa": "enable"})
            })
            .then(res => res.json())
            .then(data => {
                if (data.message === "2FA already enabled"){
                    setEnabled(true)
                    return;
                }
                setQr("data:image/png;base64," + data.qr_code_url.slice(2, data.qr_code_url.length - 1))
            })
            .catch(e => toast.error(e.toString()))
        }
    }, [dialog])

    function handle2FA(){
        setDialog(true)
    }
    function disable2FA(){
        fetch("http://127.0.0.1:5000/profile", {
                credentials: "include",
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({"2fa": "disable"})
            })
            .then(res => res.json())
            .then(data => {
                if (data.message === "2FA disabled successfully"){
                    toast.success(data.message)
                    setEnabled(false)
                    setDialog(false)
                    return;
                }
            })
            .catch(e => toast.error(e.toString()))
    }
    return (
        <>
            <Header />
            {userData ? <div className="profile-wrapper">
                <div className="username-header-wrapper">
                    <div className="username-header">
                        <h1>{userData.username}</h1>
                        <p>{userData.email}</p>
                    </div>
                    <div className="username-logout">
                        <button onClick={handle2FA}>2FA Settings</button>
                        <button onClick={handleLogout}>Logout</button>
                    </div>
                </div>
                <div className="separator"></div>
                <div className="profile-result" id="recent-results">
                    <section>
                        <h2>Recent Results</h2>
                    </section>
                    <div className="results">
                        {
                            [...Array.from(userData["recent_tests"].map((i) => {
                                return <Result testMode={i[1]} testLimit={i[2]} testWpm={i[3]} testAccuracy={i[4]} />
                            }))]
                        }
                    </div>
                </div>
                <div className="separator"></div>
                <div className="profile-result" id="word-results">
                    <section>
                        <h2>Words Results</h2>
                    </section>
                    <div className="results">
                        <Result testMode="words" testLimit="15" testWpm={wpmData["words 15"][0]} testAccuracy={wpmData["words 15"][1]} />
                        <Result testMode="words" testLimit="30" testWpm={wpmData["words 30"][0]}  testAccuracy={wpmData["words 30"][1]}  />
                        <Result testMode="words" testLimit="60" testWpm={wpmData["words 60"][0]}  testAccuracy={wpmData["words 60"][1]}  />
                        <Result testMode="words" testLimit="90" testWpm={wpmData["words 90"][0]}  testAccuracy={wpmData["words 90"][1]}  />
                    </div>
                </div>
                <div className="separator"></div>
                <div className="profile-result" id="time-results">
                    <section>
                        <h2>Timed Results</h2>
                    </section>
                    <div className="results">
                        <Result testMode="time" testLimit="15" testWpm={wpmData["time 15"][0]}  testAccuracy={wpmData["time 15"][1]} />
                        <Result testMode="time" testLimit="30" testWpm={wpmData["time 30"][0]}  testAccuracy={wpmData["time 30"][1]} />
                        <Result testMode="time" testLimit="60" testWpm={wpmData["time 60"][0]}  testAccuracy={wpmData["time 60"][1]} />
                        <Result testMode="time" testLimit="90" testWpm={wpmData["time 90"][0]}  testAccuracy={wpmData["time 90"][1]} />
                    </div>
                </div>
            </div> : <div id="profile-loader">Loading Profile...</div>}
            <Dialog
                PaperProps={{
                style: {
                    backgroundColor: "transparent",
                    boxShadow: "none",
                },
                }}
                open={dialog}
                onKeyDown={handleKeyDown}
            >
                <DialogTitle>
                    {enabled ? <button id="disable-2fa" onClick={disable2FA}>Disable 2FA</button> : 
                    <>
                        <h1 style={{color: "var(--primary)"}}>Scan QR Code</h1>
                        <img height={400} width={400} src={qr} />
                    </>}
                </DialogTitle>
            </Dialog>
            <ToastContainer position="top-right" autoClose={2500} hideProgressBar={false} newestOnTop={true} closeOnClick rtl={false} pauseOnHover theme="dark"/>
            
        </>
    )
}

export default UserProfile;