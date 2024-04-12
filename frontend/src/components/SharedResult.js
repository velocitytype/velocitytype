import React, {useState, useEffect} from "react";
import ResultStats from "./ResultStats";
import '../style/sharedresult.css';
import Header from "./Header";
import '../style/input.css';
import { useParams } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// This shows results of a user via given id
function SharedResult(){
    // get id from parameters of the url
    const { id } = useParams();
    // set up data
    const [username, setUsername] = useState("")
    const [mode, setMode] = useState("")
    const [limit, setLimit] = useState("")
    const [wpm, setWpm] = useState("")
    const [accuracy, setAccuracy] = useState("")
    const [time, setTime] = useState("")
    // set up ready to know if the result is loaded or not
    const [ready, setReady] = useState(false)

    // on load, fetch the result of the given id from the server
    useEffect(() => {
        fetch(`http://127.0.0.1:5000/result?id=${id}`)
        .then(res => res.json())
        .then(data => {
            if (data.message === "Result fetched successfully"){
                setUsername(data.result[0][0])
                setMode(data.result[0][1])
                setLimit(data.result[0][2])
                setWpm(Math.round(data.result[0][3]))
                setAccuracy(Math.round(data.result[0][4]))
                setTime(data.result[0][5] * 1000)
                setReady(true)
            } else {
                toast.error(data.message)
            }
        })
        .catch(e => toast.error(e.toString()))
    }, [])
    return (
        <>
            <Header />
            <div className="shared-result-wrapper">
                {ready && <span id="shared-result-title">{username}'s result | {new Date(time).toUTCString().slice(5, 22)}</span> }
                {ready && <ResultStats status="finished" wpm={wpm} limitStart={limit} currMode="words" accuracy={accuracy}></ResultStats>}
                {!ready && <div><h1>Loading Results</h1></div>}
            </div>
            <ToastContainer position="top-right" autoClose={2500} hideProgressBar={false} newestOnTop={true} closeOnClick rtl={false} pauseOnHover theme="dark"/>
        </>
    )
}

export default SharedResult;