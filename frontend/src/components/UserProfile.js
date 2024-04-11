import React, {useState, useEffect} from "react";
import Header from "./Header";
import Result from "./Result";
import '../style/profile.css';
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function UserProfile(){
    const [userData, setUserData] = useState(null)
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
            setUserData(data)
        })
        .catch(e => toast.error(e.toString()))
    }, [])
    function handleLogout(){
        window.localStorage.setItem("vt_login", "false")
        navigate("/")
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
            <ToastContainer position="top-right" autoClose={2500} hideProgressBar={false} newestOnTop={true} closeOnClick rtl={false} pauseOnHover theme="dark"/>
        </>
    )
}

export default UserProfile;