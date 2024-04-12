// Imports

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
import { IoMdShare } from "react-icons/io";
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
  // play will used to play key tap sounds
  const [play] = useSound(tap);

  // useMemo to create an array with 0's same as words' array length
  const wordRefs = useMemo(
    () =>
      Array(words.length)
        .fill(0)
        .map((i) => React.createRef()),
    [words]
  );

  // limit is the number of words/seconds
  const [limit, setLimit] = useState(limitStart);
  // intervalId to observe and stop wpm calculation after limit ends (for timed mode)
  const [intervalId, setIntervalId] = useState(null);
  // status is the current game status, waiting, started or finished
  const [status, setStatus] = useState("waiting");
  // currInput is the current input (word) entered by the user
  const [currInput, setCurrInput] = useState("");
  // currWordIdx is the index of the currently active word (the one which user is typing)
  const [currWordIdx, setCurrWordIdx] = useState(0);
  // currCharIdx is the index of the currenly active char (the one which user will type)
  const [currCharIdx, setCurrCharIdx] = useState(-1);
  // the previously input word by user is stored
  const [prevInp, setPrevInp] = useState("");
  // correct is the set containing words which the user correctly typed
  const [correct, setCorrect] = useState(new Set());
  // incorrect is the set containing words which the user incorrectly typed
  const [incorrect, setIncorrect] = useState(new Set());
  // wordsHistory keeps the history of words
  const [wordsHistory, setWordsHistory] = useState({});
  // raw is the raw wpm of the user
  const [raw, setRaw] = useState(0);
  // wpmStrokes is the number of correct strokes of a user
  const [wpmStrokes, setWpmStrokes] = useState(0);
  // wpm is the words per minute speed of a user
  const [wpm, setWpm] = useState(0);
  // charStats contains how many characters are typed correctly, incorrectly, missing, extra
  const [charStats, setCharStats] = useState([]);
  // charData contains data regarding characters
  const [charData, setCharData] = useState({});
  const keyString = currWordIdx + "." + currCharIdx;
  // currChar is the current character typed by the user
  const [currChar, setCurrChar] = useState("");
  // currMode is the currently selected mode (words / time)
  const currMode = mode;
  // wordsStart is the starting time of test when mode is words
  const [wordsStart, setWordsStart] = useState(0)
  // soundMode is to determine if the user has sound active or not
  const [soundMode, setSoundMode] = useLocalValue(false, "sound");
  // it keeps track of whether the on-screen keyboard is active or not
  const [keyboardActive, setKeyboardActive] = useState(false)
  // currKey is the current key pressed by the user (any key on the keyboard)
  const [currKey, setCurrKey] = useState("")
  // this toggles stats when a user starts typing
  const [remStatsClass, setRemStatsClass] = useState("rem-stats-wrapper")
  // leaderboardData contains the results of the game
  const [leaderboardData, setLeaderboardData] = useState([])
  // socket object to communicate to server
  const socket = useContext(SocketContext)
  // resultId to fetch result later
  const [resultId, setResultId] = useState(null)

  // start function starts the test
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
              // get correctly written chars
              const correctChars = Object.values(charData).filter(
                (e) => e === true
              ).length;
              // get incorrectly written chars
              const incorrectChars = Object.values(charData).filter(
                (e) => e === false
              ).length;
              // get missing chars
              const missingChars = Object.values(charData).filter(
                (e) => e === undefined
              ).length;
              // total chars for calculation
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
    // set wpm when limit changes
    if (wpmStrokes !== 0) {
      const currWpm =
        (wpmStrokes / 5 / (limitStart - limit)) * 60.0;
      setWpm(currWpm);
    }
  }, [limit])

  socket.on("leaderboard", data => {
    // as soon as we get results, update it
    setLeaderboardData(data.data)
  })
  useEffect(() => {
    if (status === "finished"){
      // if test ended, do the wpm, accuracy calculations
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
      // payload to send to API to save results
      const payload = {"test_mode": currMode, "test_limit": limitStart, "wpm": Math.round(wpm * 100) / 100, "accuracy": Math.round(accuracy * 100) / 100, "test_time": testTime, "md5_hash": md5Hash}
      // emits game-end event so the server knows the user has completed the test
      socket.emit("game-end", {"roomId": roomId, "username": username, "wpm": Math.round(wpm * 100) / 100, "accuracy": Math.round(accuracy * 100) / 100})

      // if user is not logged in, no need to save data
      if (window.localStorage.getItem("vt_login") !== "true"){
        return;
      }

      // saves data to the server
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
        setResultId(data.UID)
        toast.success("Result saved successfully")
      })
      .catch(e => toast.error(e.toString()))
    }
  }, [status])

  const handleKeyDown = (e) => {
    // if soundMode is true then play key tap sound on each key tap
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
    // if status is started and currMode is words, check if the game is ended and toggle stats
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

    // if game is not started, start the game
    if (status !== "started" && status !== "finished") {
      start();
    }

    // handle space key tap
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
      // handle backspace key tap
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

  // function to get extra characters class name for styling
  const getExtraCharClassName = (i, idx, extra) => {
    if (
      currWordIdx === i &&
      idx === extra.length - 1
    ) {
      return "right-char-error-extra";
    }
    return "char-error";
  };

  // function to get extra characters for styling
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

  // checks when space is pressed, if the previously entered word is correct or not
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

  // function to get words class name for styling
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

  // function to get characters class name for styling
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

  const handleShare = () => {
    if (window.localStorage.getItem("vt_login") !== "true"){
      toast.error("You must login to share your result");
      return;
    }
    if (!resultId){
      toast.error("Please try again later");
      return;
    }
    navigator.clipboard.writeText(`http://localhost:3000/results/${resultId}`)
    toast.success("Link copied successfully")
  }

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
                {status === "finished" ? <Tooltip title="Share your result">
                <IconButton
                  id="share-result-button"
                  style={{fontSize: "16px"}}
                  aria-label="share"
                  color="primary"
                  size="medium"
                  onClick={handleShare}
                >
                  <IoMdShare />
                </IconButton>
              </Tooltip> : ""}
            </Box>
          </Grid>
          <ToastContainer position="top-right" autoClose={2500} hideProgressBar={false} newestOnTop={true} closeOnClick rtl={false} pauseOnHover theme="dark"/>
      </>
  );
};

export default GameInput;
