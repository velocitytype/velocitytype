import React, { useEffect, useState, useMemo, useContext } from "react";
import useSound from "use-sound";
import '../style/input.css';
import IconButton from '@mui/material/IconButton';
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import useLocalValue from "../hooks/useLocalValue";
import GameStats from "./GameStats";
import md5 from "md5";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  KEYBOARD_TOOLTIP
} from "../constants/Constants";
import tap from "../sounds/tap.wav";
import Keyboard from "./Keyboard";
import { FaRegKeyboard } from "react-icons/fa";
import { SocketContext } from "./SocketContext";
import GameResultUser from "./GameResultUser";

const GameInput = ({
  textInputRef,
  handleInputFocus,
  words,
  limitStart,
  roomId,
  username,
  mode
}) => {
  const [play] = useSound(tap);
  const wordRefs = useMemo(
    () =>
      Array(words.length)
        .fill(0)
        .map((i) => React.createRef()),
    [words]
  );

  const [limit, setLimit] = useState(limitStart);
  const [intervalId, setIntervalId] = useState(null);
  const [status, setStatus] = useState("waiting");
  const [currInput, setCurrInput] = useState("");
  const [currWordIdx, setCurrWordIdx] = useState(0);
  const [currCharIdx, setCurrCharIdx] = useState(-1);
  const [prevInp, setPrevInp] = useState("");
  const [correct, setCorrect] = useState(new Set());
  const [incorrect, setIncorrect] = useState(new Set());
  const [wordsHistory, setWordsHistory] = useState({});
  const [raw, setRaw] = useState(0);
  const [wpmStrokes, setWpmStrokes] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [charStats, setCharStats] = useState([]);
  const [charData, setCharData] = useState({});
  const keyString = currWordIdx + "." + currCharIdx;
  const [currChar, setCurrChar] = useState("");
  const currMode = mode;
  const [wordsStart, setWordsStart] = useState(0)
  const [soundMode, setSoundMode] = useLocalValue(false, "sound");
  const [keyboardActive, setKeyboardActive] = useState(false)
  const [currKey, setCurrKey] = useState("")
  const [remStatsClass, setRemStatsClass] = useState("rem-stats-wrapper")
  const [leaderboardData, setLeaderboardData] = useState([])
  const socket = useContext(SocketContext)

  const start = () => {
    if (status === "finished") {
      setCurrInput("");
      setPrevInp("");
      setCurrWordIdx(0);
      setCurrCharIdx(-1);
      setCurrChar("");
      setCharData({});
      setWordsHistory({});
      setCorrect(new Set());
      setIncorrect(new Set());
      setStatus("waiting");
      textInputRef.current.focus();
    }

    if (status !== "started") {
      setStatus("started");
      setRemStatsClass("rem-stats-wrapper active")
      if (currMode === "time"){
        let intervalId = setInterval(() => {
          setLimit((prevlimit) => {
            if (prevlimit === 0) {
              clearInterval(intervalId);
              const correctChars = Object.values(charData).filter(
                (e) => e === true
              ).length;

              const incorrectChars = Object.values(charData).filter(
                (e) => e === false
              ).length;

              const missingChars = Object.values(charData).filter(
                (e) => e === undefined
              ).length;

              const totalChars =
                correctChars +
                missingChars +
                incorrectChars;

              const accuracy =
                correctChars === 0
                  ? 0
                  : (correctChars / totalChars) * 100;

              setCharStats([
                accuracy,
                correctChars,
                incorrectChars,
                missingChars,
                totalChars,
              ]);

              checkPrev();
              setStatus("finished");

              return limitStart;
            } else {
              return prevlimit - 1;
            }
          });
        }, 1000);
        setIntervalId(intervalId);
      } else {
        setWordsStart(parseInt(new Date().getTime() / 1000))
      }
    }
  };

  const handleInput = (e) => {
    if (status === "finished") {
      return;
    }
    setCurrInput(e.target.value);
    wordsHistory[currWordIdx] = e.target.value.trim();
    setWordsHistory(wordsHistory);
  };

  useEffect(() => {
    if (limitStart == limit) return
    if (wpmStrokes !== 0) {
      const currWpm =
        (wpmStrokes / 5 / (limitStart - limit)) * 60.0;
      setWpm(currWpm);
    }
  }, [limit])

  socket.on("leaderboard", data => {
    console.log(data)
    setLeaderboardData(data.data)
  })
  useEffect(() => {
    if (status === "finished"){
      setRemStatsClass("rem-stats-wrapper")
      const testTime = parseInt(new Date().getTime() / 1000)
      const text = testTime.toString() + " " + currMode + " " + limitStart.toString()
      const md5Hash = md5(text)
      const correctChars = Object.values(charData).filter(
        (e) => e === true
      ).length;
      const incorrectChars = Object.values(charData).filter(
        (e) => e === false
      ).length;
      const missingChars = Object.values(charData).filter(
        (e) => e === undefined
      ).length;
      const totalChars = correctChars + missingChars + incorrectChars;
      const accuracy = correctChars === 0 ? 0 : (correctChars / totalChars) * 100;
      const payload = {"test_mode": currMode, "test_limit": limitStart, "wpm": Math.round(wpm * 100) / 100, "accuracy": Math.round(accuracy * 100) / 100, "test_time": testTime, "md5_hash": md5Hash}
      socket.emit("game-end", {"roomId": roomId, "username": username, "wpm": Math.round(wpm * 100) / 100, "accuracy": Math.round(accuracy * 100) / 100})
      if (window.localStorage.getItem("vt_login") !== "true"){
        return;
      }
      fetch("http://127.0.0.1:5000/stats", {
        method: "POST",
        credentials: "include",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload)
      })
      .then(res => res.json())
      .then(data => {
        if (data.message === "Invalid Authorization token"){
          window.localStorage.setItem("vt_login", "false")
          toast.warning("Login again to save your results")
          return
        }
        toast.success("Result saved successfully")
      })
      .catch(e => toast.error(e.toString()))
    }
  }, [status])

  const handleKeyDown = (e) => {
    if (status !== "finished" && soundMode) {
      play();
    }
    const key = e.key;
    const keyCode = e.keyCode;
    setCurrKey(key)
    if (status === "started") {
      setRaw(raw + 1);
      if(words[currWordIdx][currCharIdx+1] == key){
        setWpmStrokes(wpmStrokes + 1);
      }
    }
    if (status === "started" && currMode === "words"){
      if ((currWordIdx === words.length - 1 && currCharIdx + 2 === words[currWordIdx].length) || (currWordIdx === words.length)){
        const extraChars = Object.values(charData)
          .filter((e) => typeof e === "number")
          .reduce((a, b) => a + b, 0);
        const correctChars = Object.values(charData).filter(
          (e) => e === true
        ).length;
        const incorrectChars = Object.values(charData).filter(
          (e) => e === false
        ).length;
        const missingChars = Object.values(charData).filter(
          (e) => e === undefined
        ).length;
        const totalChars = correctChars + missingChars + incorrectChars;
        const accuracy =
          correctChars === 0
            ? 0
            : (correctChars / totalChars) * 100;
        setCharStats([
          accuracy,
          correctChars,
          incorrectChars,
          missingChars,
          totalChars,
          extraChars,
        ]);

        checkPrev();
        setStatus("finished");
      } else {
        if(words[currWordIdx][currCharIdx+1] == key){
          if (wpmStrokes !== 0) {
            const currTime = parseInt(new Date().getTime() / 1000)
            const currWpm =
              (wpmStrokes / 5 / (currTime - wordsStart)) * 60.0;
            setWpm(currWpm);
          }
        }
      }
    }

    if (keyCode === 9) {
      e.preventDefault();
      return;
    }

    if (status === "finished") {
      setCurrInput("");
      setPrevInp("");
      return;
    }
    if (status !== "started" && status !== "finished") {
      start();
    }

    if (keyCode === 32) {
      const prev = checkPrev();
      if (prev === true || prev === false) {
        setCurrInput("");
        setCurrWordIdx(currWordIdx + 1);
        setCurrCharIdx(-1);
        return;
      } else {
        return;
      }

    } else if (keyCode === 8) {
      delete charData[keyString];
      setRaw(raw - 1)

      if (currCharIdx < 0) {
        if (incorrect.has(currWordIdx - 1)) {
          const prevInpWord = wordsHistory[currWordIdx - 1];
          setCurrInput(prevInpWord + " ");
          setCurrCharIdx(prevInpWord.length - 1);
          setCurrWordIdx(currWordIdx - 1);
          setPrevInp(prevInpWord);
        }
        return;
      }
      setCurrCharIdx(currCharIdx - 1);
      setCurrChar("");
      return;
    } else {
      setCurrCharIdx(currCharIdx + 1);
      setCurrChar(key);
      return;
    }
  };

  const getExtraCharClassName = (i, idx, extra) => {
    if (
      currWordIdx === i &&
      idx === extra.length - 1
    ) {
      return "right-char-error-extra";
    }
    return "char-error";
  };

  const getExtraCharsDisplay = (word, i) => {
    let input = wordsHistory[i];
    if (!input) {
      input = currInput.trim();
    }
    if (i > currWordIdx) {
      return null;
    }
    if (input.length <= word.length) {
      return null;
    } else {
      const extra = input.slice(word.length, input.length).split("");
      charData[i] = extra.length;
      return extra.map((c, idx) => (
        <span key={idx} className={getExtraCharClassName(i, idx, extra)}>
          {c}
        </span>
      ));
    }
  };

  const checkPrev = () => {
    const currWord = words[currWordIdx];
    const currInputWord = currInput.trim();
    const wordCorrect = currWord === currInputWord;
    if (!currInputWord || currInputWord.length === 0) {
      return null;
    }
    if (wordCorrect) {
      correct.add(currWordIdx);
      incorrect.delete(currWordIdx);
      let newWordsHistory = { ...wordsHistory };
      newWordsHistory[currWordIdx] = currInputWord;
      setWordsHistory(newWordsHistory);
      setPrevInp("");
      setWpmStrokes(wpmStrokes + 1);
      return true;
    } else {
      incorrect.add(currWordIdx);
      correct.delete(currWordIdx);
      let newWordsHistory = { ...wordsHistory };
      newWordsHistory[currWordIdx] = currInputWord;
      setWordsHistory(newWordsHistory);
      setPrevInp(prevInp + " " + currInputWord);
      return false;
    }
  };

  const getWordClass = (wordIdx) => {
    if (incorrect.has(wordIdx)) {
      if (currWordIdx === wordIdx) {
        return "word word-error word-active";
      }
      return "word word-error";
    } else {
      if (currWordIdx === wordIdx) {
        return "word word-active";
      }
      return "word";
    }
  };

  const getCharClass = (wordIdx, charIdx, char, word) => {
    const keyString = wordIdx + "." + charIdx;
    if (
      wordIdx === currWordIdx &&
      charIdx === currCharIdx + 1 &&
      status !== "finished"
    ) {
      return "left-char";
    }
    if (charData[keyString] === true) {
      if (
        wordIdx === currWordIdx &&
        word.length - 1 === currCharIdx &&
        charIdx === currCharIdx &&
        status !== "finished"
      ) {
        return "right-char-correct";
      }
      return "char-correct";
    }
    if (charData[keyString] === false) {
      if (
        wordIdx === currWordIdx &&
        word.length - 1 === currCharIdx &&
        charIdx === currCharIdx &&
        status !== "finished"
      ) {
        return "right-char-error";
      }
      return "char-error";
    }
    if (
      wordIdx === currWordIdx &&
      charIdx === currCharIdx &&
      currChar &&
      status !== "finished"
    ) {
      if (char === currChar) {
        charData[keyString] = true;
        return "char-correct";
      } else {
        charData[keyString] = false;
        return "char-error";
      }
    } else {
      if (wordIdx < currWordIdx) {
        charData[keyString] = undefined;
      }
      return "char";
    }
  };

  return (
    <>
        <div className={remStatsClass}>
          <div className="rem-stats">
            {
              currMode === "words" ?
              <span>{currWordIdx}/{words.length}</span>
              : <span>{limit}s </span>
            }
          </div>
          <div className="menu-separator">|</div>
          <div className="rem-wpm">
            <span>WPM: {Math.round(wpm)}</span>
          </div>
        </div>
        <div onClick={handleInputFocus} className="input-wrapper">
          {status !== "finished" && (
            <div className="main-input">
              <div className="words">
                {words.map((word, i) => (
                  <span
                    key={i}
                    ref={wordRefs[i]}
                    className={getWordClass(i)}
                  >
                    {word.split("").map((char, idx) => (
                      <span
                        key={"word" + idx}
                        className={getCharClass(i, idx, char, word)}
                      >
                        {char}
                      </span>
                    ))}
                    {getExtraCharsDisplay(word, i)}
                  </span>
                ))}
              </div>
            </div>
          )}
          <Keyboard isActive={keyboardActive} currKey={currKey}/>
          {status === "finished" ? 
          <div className="game-results-wrapper">
            <div className="game-leaderboard">
              <h2>Current Results</h2>
              <div className="game-results">
                {
                  [...Array.from(leaderboardData.map(i => <GameResultUser username={i["username"]} wpm={Math.round(i["wpm"])} accuracy={Math.round(i["accuracy"])} rank={leaderboardData.indexOf(i) + 1} />))]
                }
              </div>
            </div>
            <div className="game-stats">
              <GameStats
                status={status}
                wpm={wpm}
                charStats={charStats}
              ></GameStats>
            </div>
          </div>
          : "" }
          <input
            key="user-input"
            ref={textInputRef}
            type="text"
            className="user-input"
            onKeyDown={(e) => handleKeyDown(e)}
            onKeyUp={(e) => setCurrKey("")}
            value={currInput}
            onChange={(e) => handleInput(e)}
          />
        </div>
        <Grid container justifyContent="center" alignItems="center">
            <Box display="flex" flexDirection="row" style={{marginTop: "9rem"}}>
              { status !== "finished" ? 
              <Tooltip title={KEYBOARD_TOOLTIP}>
                <IconButton
                  id="keyboard-button"
                  style={{fontSize: "16px"}}
                  aria-label="keyboard"
                  color="primary"
                  size="medium"
                  onClick={() => {
                    setKeyboardActive(!keyboardActive)
                  }}
                >
                  <FaRegKeyboard />
                </IconButton>
              </Tooltip>
              : <Tooltip title="Play again">
                <IconButton
                  id="play-again-button"
                  style={{fontSize:"16px"}}
                  aria-label="play-again"
                  color="primary"
                  size="medium"
                  onClick={() => window.location.reload()}
                  >
                    <RestartAltIcon />
                  </IconButton>
              </Tooltip>
                }
            </Box>
          </Grid>
          <ToastContainer position="top-right" autoClose={2500} hideProgressBar={false} newestOnTop={true} closeOnClick rtl={false} pauseOnHover theme="dark"/>
      </>
  );
};

export default GameInput;
