import React from "react";
import { FaCrown } from "react-icons/fa";

function GameResultUser({username, wpm, accuracy, rank}){
    return (
        <div className="game-result-user">
            <span id="user-rank" className={rank === 1 ? "rank-one" : "rank"}>{rank === 1 ? <FaCrown style={{color: "var(--primary"}} /> : rank}</span>
            <span id="user-username">{username}</span>
            <section>
                <span id="user-wpm">{wpm}</span>
                <span id="user-accuracy">{accuracy}%</span>
            </section>
        </div>
    )
}

export default GameResultUser;