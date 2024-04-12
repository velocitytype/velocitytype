// Imports
import React, { useEffect, useState, useMemo } from "react";
import useSound from "use-sound";
import '../style/input.css';
import { generateSentence } from "../scripts/randomSentence";
import IconButton from '@mui/material/IconButton';
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import useLocalValue from "../hooks/useLocalValue";
import Stats from "./Stats";
import { Dialog } from "@mui/material";
import md5 from "md5";
import DialogTitle from "@mui/material/DialogTitle";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import UndoIcon from "@mui/icons-material/Undo";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  DEFAULT_WORDS_COUNT,
  DEFAULT_COUNT_DOWN,
  NUMBER,
  SYMBOL,
  NUMBER_TOOLTIP,
  SYMBOL_TOOLTIP,
  RESTART_TOOLTIP,
  REDO_TOOLTIP,
  NUMBER_KEY,
  SYMBOL_KEY,
  SOUND_TOOLTIP,
  KEYBOARD_TOOLTIP
} from "../constants/Constants";
import tap from "../sounds/tap.wav";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import Keyboard from "./Keyboard";
import { FaRegKeyboard } from "react-icons/fa";
import { IoMdShare } from "react-icons/io";

const Input = ({
  textInputRef,
  handleInputFocus,
}) => {
  // play used to play key taps
  const [play] = useSound(tap);
  // the limit of the current test
  const [limitStart, setLimitStart] = useLocalValue(
    DEFAULT_COUNT_DOWN,
    "timer-constant"
  );
  // number mode toggle
  const [numberMode, setNumberMode] = useLocalValue(
    false,
    NUMBER_KEY
  )
  // symbol mode toggle
  const [symbolMode, setSymbolMode] = useLocalValue(
    false,
    SYMBOL_KEY
  )
  // tab dialog toggle
  const [restartDialog, setRestartDialog] = useState(false);

  // handles tab presses, opens dialog
  const tabEnterReset = (e) => {
    // if tab or enter is pressed, reset the game
    if (e.keyCode === 13 || e.keyCode === 9) {
      e.preventDefault();
      setRestartDialog(false);
      reset(limitStart, numberMode, symbolMode, false);
    }
    // if space is pressed, redo the game
    else if (e.keyCode === 32) {
      e.preventDefault();
      setRestartDialog(false);
      reset(limitStart, numberMode, symbolMode, true);
      // if k is pressed, toggle on-screen keyboard
    } else if (e.keyCode === 75) {
      e.preventDefault();
      setRestartDialog(false)
      setKeyboardActive(!keyboardActive);
    } else {
      // else close the dialog
      e.preventDefault();
      setRestartDialog(false);
    }
  };
  // handles tab press
  const handleTab = () => {
    setRestartDialog(true);
  };

  // current words list used in test
  const [wordsList, setWordsList] = useState(() => {
      return generateSentence(numberMode, symbolMode, DEFAULT_WORDS_COUNT);
  });
  // current words memo
  const words = useMemo(() => {
    return wordsList.map((e) => e);
  }, [wordsList]);
  // create an array of length == words.length and fills it with 0's
  const wordRefs = useMemo(
    () =>
      Array(words.length)
        .fill(0)
        .map((i) => React.createRef()),
    [words]
  );

  // set up current limit
  const [limit, setLimit] = useState(limitStart);
  // set up interval id, used for timed mode
  const [intervalId, setIntervalId] = useState(null);
  // set up current status of game
  const [status, setStatus] = useState("waiting");
  // set up current input of the user
  const [currInput, setCurrInput] = useState("");
  // the index of the word user has to type
  const [currWordIdx, setCurrWordIdx] = useState(0);
  // the index of the character of the current word that the user has to type
  const [currCharIdx, setCurrCharIdx] = useState(-1);
  // prevInp is used to handle space key taps and set data accordingly
  const [prevInp, setPrevInp] = useState("");
  // correct is the set of correctly typed words by the user
  const [correct, setCorrect] = useState(new Set());
  // incorrect is the set of incorrectly typed words by the user
  const [incorrect, setIncorrect] = useState(new Set());
  // history of words
  const [wordsHistory, setWordsHistory] = useState({});
  // raw wpm of the user, every stroke counts
  const [raw, setRaw] = useState(0);
  // wpmStrokes is the strokes when user types correctly
  const [wpmStrokes, setWpmStrokes] = useState(0);
  // wpm is the current wpm
  const [wpm, setWpm] = useState(0);
  // charStats contains correct, incorrect, missing, extra characters input by the user
  const [charStats, setCharStats] = useState([]);
  // data related to each char
  const [charData, setCharData] = useState({});
  const keyString = currWordIdx + "." + currCharIdx;
  // the curr character that user has to type
  const [currChar, setCurrChar] = useState("");
  // the current game mode (initally words)
  const [currMode, setCurrMode] = useState("words")
  // wordsStart is the time when user starts typing the words in words mode, used for wpm counting
  const [wordsStart, setWordsStart] = useState(0)
  // soundMode toggles key tap plays
  const [soundMode, setSoundMode] = useLocalValue(false, "sound");
  // toggles if the on-screen keyboard is active or not
  const [keyboardActive, setKeyboardActive] = useState(false)
  // current key pressed by the user to show on on-screen keyboard
  const [currKey, setCurrKey] = useState("")
  // remaining stats class toggle
  const [remStatsClass, setRemStatsClass] = useState("rem-stats-wrapper")
  // resultId is the unique id of the result after test
  const [resultId, setResultId] = useState(null)

  // toggles soundMode (on/off)
  const toggleSoundMode = () => {
    setSoundMode(!soundMode);
  };

  // whenever words are about to end, generate more words
  useEffect(() => {
    if (currWordIdx === DEFAULT_WORDS_COUNT - 1) {
        const generatedEng = generateSentence(
          numberMode,
          symbolMode,
          DEFAULT_WORDS_COUNT,
        );
        setWordsList((currentArray) => [...currentArray, ...generatedEng]);
    }
    if (currWordIdx === limitStart-1 && currCharIdx + 2 === words[currWordIdx].length) return
  }, [currWordIdx, wordRefs, numberMode, symbolMode]);

  // if mode is words, limit = words else limit = 100
  useEffect(() => {
    if (currMode === "words"){
      const generatedEng = generateSentence(
        numberMode,
        symbolMode,
        limitStart,
      );
      setWordsList(generatedEng);
    } else {
      const generatedEng = generateSentence(
        numberMode,
        symbolMode,
        DEFAULT_WORDS_COUNT,
      );
      setWordsList(generatedEng);
    }
  }, [currMode, limitStart])

  // resets all game data and game
  const reset = (newlimit, newnumberMode, newsymbolMode, isRedo, isCustom=false) => {
    setStatus("waiting");
    if (!isRedo) {
      if (currMode === "words"){
        setWordsList(generateSentence(newnumberMode, newsymbolMode, limitStart));
      } else {
        setWordsList(generateSentence(newnumberMode, newsymbolMode, DEFAULT_WORDS_COUNT));
      }
    }
    if (newlimit === ""){
      newlimit = 15;
    }
    setNumberMode(newnumberMode);
    setSymbolMode(newsymbolMode);
    setLimitStart(newlimit);
    setLimit(newlimit);
    clearInterval(intervalId);
    setWpm(0);
    setRaw(0);
    setWpmStrokes(0);
    setCurrInput("");
    setPrevInp("");
    setIntervalId(null);
    setCurrWordIdx(0);
    setCurrCharIdx(-1);
    setCurrChar("");
    setCharData({});
    setWordsHistory({});
    setCorrect(new Set());
    setIncorrect(new Set());
    if (!isCustom){
      textInputRef.current.focus();
    }
  };

  // starts the game
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
        // set interval id to use later if mode is timed
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

  // handles input in the hidden input
  const handleInput = (e) => {
    if (status === "finished") {
      return;
    }
    setCurrInput(e.target.value);
    wordsHistory[currWordIdx] = e.target.value.trim();
    setWordsHistory(wordsHistory);
  };

  // whenever limit changes, update the wpm
  useEffect(() => {
    if (limitStart == limit) return
    if (wpmStrokes !== 0) {
      const currWpm =
        (wpmStrokes / 5 / (limitStart - limit)) * 60.0;
      setWpm(currWpm);
    }
  }, [limit])

  // if status is finished, calculate the results and send the results to the server if user if logged in
  useEffect(() => {
    if (status === "finished"){
      setKeyboardActive(false)
      setRemStatsClass("rem-stats-wrapper")
      // if user is not logged in, return
      if (window.localStorage.getItem("vt_login") !== "true"){
        return;
      }
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
        // set result id to the unique id received
        setResultId(data.UID)
        toast.success("Result saved successfully")
      })
      .catch(e => toast.error(e.toString()))
    }
  }, [status])

  // handles each key press
  const handleKeyDown = (e) => {
    // if game is not finished and soundMode is on, play key tap
    if (status !== "finished" && soundMode) {
      play();
    }
    const key = e.key;
    const keyCode = e.keyCode;
    setCurrKey(key)
    if (status === "started") {
      // each stroke counts for raw
      setRaw(raw + 1);
      if(words[currWordIdx][currCharIdx+1] == key){
        setWpmStrokes(wpmStrokes + 1);
      }
    }
    // checks if the character entered is the last character of words, to toggle statistics 
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

    // if tab is pressed, handle it
    if (keyCode === 9) {
      e.preventDefault();
      handleTab();
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

    // if space is pressed, move on the next word
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
      // if backspace is pressed, remove the character
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

  // gets extra typed (error) characters name for styling
  const getExtraCharClassName = (i, idx, extra) => {
    if (
      currWordIdx === i &&
      idx === extra.length - 1
    ) {
      return "right-char-error-extra";
    }
    return "char-error";
  };

  // gets extra typed characters name for styling
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

  // checks if the previous word written by the user was correct or not
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

  // gets word class used for styling
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

  // gets character class, used for styling
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

  // gets game mode class used for styling

  const getModeClass = (addon) => {
    if (addon) {
      return "active-button";
    }
    return "inactive-button";
  };

  // gets timer class, used for styling
  const getTimerClass = (buttonTimerlimit) => {
    if (limitStart === buttonTimerlimit) {
      return "active-button";
    }
    return "inactive-button";
  };

  // gets sound button class, used for styling
  const getSoundClass = (mode) => {
    if (mode) {
      return "sound-button";
    }
    return "sound-button-deactive";
  };

  // copies result link to clipboard whenever share button is clicked
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
      <div className="restart-button" key="restart-button">
          <Grid container justifyContent="center" alignItems="center">
            <Box display="flex" flexDirection="row">
                <>
                  <IconButton
                    style={{fontSize: "16px"}}
                    onClick={() => {
                      reset(
                        limitStart,
                        !numberMode,
                        symbolMode,
                        false
                      );
                    }}
                  >
                    <Tooltip
                      title={
                        NUMBER_TOOLTIP
                      }
                    >
                      <span
                        className={getModeClass(
                          numberMode
                        )}
                      >
                        {NUMBER}
                      </span>
                    </Tooltip>
                  </IconButton>
                  <IconButton
                    style={{fontSize: "16px"}}
                    onClick={() => {
                      reset(
                        limitStart,
                        numberMode,
                        !symbolMode,
                        false
                      );
                    }}
                  >
                    <Tooltip
                      title={
                        SYMBOL_TOOLTIP
                      }
                    >
                      <span
                        className={getModeClass(
                          symbolMode
                        )}
                      >
                        {SYMBOL}
                      </span>
                    </Tooltip>
                  </IconButton>
                  <IconButton onClick={() => {}}>
                    <span className="menu-separator"> | </span>
                  </IconButton>
                  <IconButton 
                    style={{fontSize: "16px"}}
                    onClick={() => setCurrMode("words")}>
                    <span className={currMode == "words" ? "words-mode active-button" : "words-mode inactive-button"}>Words</span>
                  </IconButton>
                  <IconButton 
                    style={{fontSize: "16px"}}
                    onClick={() => setCurrMode("time")}>
                    <span className={currMode == "time" ? "time-mode active-button" : "time-mode inactive-button"}>Time</span>
                  </IconButton>
                  <IconButton onClick={() => {}}>
                    <span className="menu-separator"> | </span>
                  </IconButton>
                  <IconButton 
                    onClick={toggleSoundMode} style={{marginTop: "0.3rem", fontSize: "16px"}}>
                    <Tooltip title={SOUND_TOOLTIP}>
                      <span className={getSoundClass(soundMode)}>
                        <VolumeUpIcon fontSize="medium"></VolumeUpIcon>
                      </span>
                    </Tooltip>
                  </IconButton>
                </>
            </Box>
            <Box display="flex" flexDirection="row" alignItems="center">
              <>
                  <IconButton
                    style={{fontSize: "16px"}}
                    onClick={() => {
                      reset(15, numberMode, symbolMode, false);
                    }}
                  >
                    <span className={getTimerClass(15)}>
                      {15}
                    </span>
                  </IconButton>

                  <IconButton
                    style={{fontSize: "16px"}}
                    onClick={() => {
                      reset(30, numberMode, symbolMode, false);
                    }}
                  >
                    <span className={getTimerClass(30)}>
                      {30}
                    </span>
                  </IconButton>

                  <IconButton
                    style={{fontSize: "16px"}}
                    onClick={() => {
                      reset(60, numberMode, symbolMode, false);
                    }}
                  >
                    <span className={getTimerClass(60)}>
                      {60}
                    </span>
                  </IconButton>

                  <IconButton
                    style={{fontSize: "16px"}}
                    onClick={() => {
                      reset(90, numberMode, symbolMode, false);
                    }}
                  >
                    <span className={getTimerClass(90)}>
                      {90}
                    </span>
                  </IconButton>
                  <input onChange={(e) => reset(e.target.value, numberMode, symbolMode, false, true)} id="custom-limit-input" type="number" min={1} max={500} />
              </>
            </Box>
            
          </Grid>
        </div>
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
          <div className="stats">
            <Stats
              status={status}
              wpm={wpm}
              limitStart={limitStart}
              charStats={charStats}
              raw={raw}
              currMode={currMode}
            ></Stats>
          </div>
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
          <Dialog
            PaperProps={{
              style: {
                backgroundColor: "transparent",
                boxShadow: "none",
              },
            }}
            open={restartDialog}
            onKeyDown={tabEnterReset}
          >
            <DialogTitle>
              <div>
                <span className="dialog-text"> Press </span>
                <span className="dialog-text-gray">Space</span>
                <span className="dialog-text"> to redo</span>
              </div>
              <div>
                <span className="dialog-text"> Press </span>
                <span className="dialog-text-gray">Tab</span>{" "}
                <span className="dialog-text">/</span>{" "}
                <span className="dialog-text-gray">Enter</span>{" "}
                <span className="dialog-text"> to restart</span>
              </div>
              <div>
                <span className="dialog-text"> Press </span>
                <span className="dialog-text-gray">K</span>{" "}
                <span className="dialog-text"> to toggle on-screen keyboard</span>
              </div>
              <span className="dialog-text"> Press </span>
              <span className="dialog-text-gray">any key</span>
              <span className="dialog-text"> to exit</span>
            </DialogTitle>
          </Dialog>
        </div>
        <Grid container justifyContent="center" alignItems="center">
            <Box display="flex" flexDirection="row" style={{marginTop: "9rem"}}>
              <IconButton
                style={{fontSize: "16px"}}
                aria-label="redo"
                color="primary"
                size="medium"
                onClick={() => {
                  reset(limitStart, numberMode, symbolMode, true);
                }}
              >
                <Tooltip title={REDO_TOOLTIP}>
                  <UndoIcon />
                </Tooltip>
              </IconButton>
              <IconButton
                style={{fontSize: "16px"}}
                aria-label="restart"
                color="primary"
                size="medium"
                onClick={() => {
                  reset(limitStart, numberMode, symbolMode, false);
                }}
              >
                <Tooltip title={RESTART_TOOLTIP}>
                  <RestartAltIcon />
                </Tooltip>
              </IconButton>
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

export default Input;
