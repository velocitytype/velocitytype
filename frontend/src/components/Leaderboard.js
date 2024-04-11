import React, {useState, useEffect} from "react";
import '../style/leaderboard.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from "./Header";

function Leaderboard(){
    const [timeLimit, setTimeLimit] = useState("15");
    const [wordLimit, setWordLimit] = useState("15");
    const [timeData, setTimeData] = useState([]);
    const [wordData, setWordData] = useState([]);

    const handleTimeClick = (e) => {
        document.getElementsByClassName("time-active")[0].classList.remove("time-active");
        e.target.classList.toggle("time-active")
        setTimeLimit(e.target.innerText)
    }
    const handleWordClick = (e) => {
        document.getElementsByClassName("word-active-lb")[0].classList.remove("word-active-lb");
        e.target.classList.toggle("word-active-lb")
        setWordLimit(e.target.innerText)
    }

    useEffect(() => {
        fetch("http://127.0.0.1:5000/leaderboard", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({"test_mode": "time", "test_limit": timeLimit})
        })
        .then(res => res.json())
        .then(data => setTimeData(data["max_wpm"]))
        .catch(e => toast.error(e.toString()))
    }, [timeLimit])

    useEffect(() => {
        fetch("http://127.0.0.1:5000/leaderboard", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({"test_mode": "words", "test_limit": wordLimit})
        })
        .then(res => res.json())
        .then(data => setWordData(data["max_wpm"]))
        .catch(e => toast.error(e.toString()))
    }, [wordLimit])

    return (
        <>
            <Header />
            <div className="leaderboard-wrapper">
                <div className="heading">
                    <h1>Global Leaderboard</h1>
                </div>
                <div className="leaderboard-row">
                    <div class="leaderboard" id="time-leaderboard">
                        <h1>Time
                            <span className="time-active" onClick={handleTimeClick}>15</span>
                            <span onClick={handleTimeClick}>30</span>
                            <span onClick={handleTimeClick}>60</span>
                            <span onClick={handleTimeClick}>90</span>
                        </h1>
                        <section>
                            <table>
                                <tr>
                                    <th>#</th>
                                    <th>Name</th>
                                    <th>WPM</th>
                                    <th>Accuracy</th>
                                    <th>Date</th>
                                </tr>
                                {
                                    timeData.length !== 0 ? [...Array.from(timeData.map((i) => {
                                        return (
                                            <tr>
                                                <td>{timeData.indexOf(i) + 1}</td>
                                                <td>{i[0]}</td>
                                                <td>{parseInt(i[3])}</td>
                                                <td>{parseInt(i[4])}%</td>
                                                <td>{new Date(i[5]*1000).toLocaleDateString()}</td>
                                            </tr>
                                        )
                                    }))] : <tr>
                                        <td>#</td>
                                        <td>No Data Available</td>
                                        <td>-</td>
                                        <td>-</td>
                                        <td>-</td>
                                    </tr>
                                }
                            </table>
                        </section>
                    </div>
                    <div class="leaderboard" id="word-leaderboard">
                        <h1>Word 
                            <span className="word-active-lb" onClick={handleWordClick}>15</span>
                            <span onClick={handleWordClick}>30</span>
                            <span onClick={handleWordClick}>60</span>
                            <span onClick={handleWordClick}>90</span>
                        </h1>
                        <section>
                            <table>
                                <tr>
                                    <th>#</th>
                                    <th>Name</th>
                                    <th>WPM</th>
                                    <th>Accuracy</th>
                                    <th>Date</th>
                                </tr>
                                {
                                    wordData.length !== 0 ? [...Array.from(wordData.map((i) => {
                                        return (
                                            <tr>
                                                <td>{wordData.indexOf(i) + 1}</td>
                                                <td>{i[0]}</td>
                                                <td>{parseInt(i[3])}</td>
                                                <td>{parseInt(i[4])}%</td>
                                                <td>{new Date(i[5]*1000).toLocaleDateString()}</td>
                                            </tr>
                                        )
                                    }))] : <tr>
                                        <td>#</td>
                                        <td>No Data Available</td>
                                        <td>-</td>
                                        <td>-</td>
                                        <td>-</td>
                                    </tr>
                                }
                            </table>
                        </section>
                    </div>
                </div>
            </div>
            <ToastContainer position="top-right" autoClose={2500} hideProgressBar={false} newestOnTop={true} closeOnClick rtl={false} pauseOnHover theme="dark"/>
        </>
    )
}

export default Leaderboard;