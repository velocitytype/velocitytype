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
  const [play] = useSound(tap);
  const [limitStart, setLimitStart] = useLocalValue(
    DEFAULT_COUNT_DOWN,
    "timer-constant"
  );
  const [numberMode, setNumberMode] = useLocalValue(
    false,
    NUMBER_KEY
  )
  const [symbolMode, setSymbolMode] = useLocalValue(
    false,
    SYMBOL_KEY
  )
  const [restartDialog, setRestartDialog] = useState(false);

  const tabEnterReset = (e) => {
    if (e.keyCode === 13 || e.keyCode === 9) {
      e.preventDefault();
      setRestartDialog(false);
      reset(limitStart, numberMode, symbolMode, false);
    }
    else if (e.keyCode === 32) {
      e.preventDefault();
      setRestartDialog(false);
      reset(limitStart, numberMode, symbolMode, true);
    } else if (e.keyCode === 75) {
      e.preventDefault();
      setRestartDialog(false)
      setKeyboardActive(!keyboardActive);
    } else {
      e.preventDefault();
      setRestartDialog(false);
    }
  };
  const handleTab = () => {
    setRestartDialog(true);
  };

  const [wordsList, setWordsList] = useState(() => {
      return generateSentence(numberMode, symbolMode, DEFAULT_WORDS_COUNT);
  });

  const words = useMemo(() => {
    return wordsList.map((e) => e);
  }, [wordsList]);

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
  const [currMode, setCurrMode] = useState("words")
  const [wordsStart, setWordsStart] = useState(0)
  const [soundMode, setSoundMode] = useLocalValue(false, "sound");
  const [keyboardActive, setKeyboardActive] = useState(false)
  const [currKey, setCurrKey] = useState("")
  const [remStatsClass, setRemStatsClass] = useState("rem-stats-wrapper")
  const [resultId, setResultId] = useState(null)

  const toggleSoundMode = () => {
    setSoundMode(!soundMode);
  };

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

  useEffect(() => {
    if (status === "finished"){
      setKeyboardActive(false)
      setRemStatsClass("rem-stats-wrapper")
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
        setResultId(data.UID)
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
      handleTab();
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

  const getModeClass = (addon) => {
    if (addon) {
      return "active-button";
    }
    return "inactive-button";
  };

  const getTimerClass = (buttonTimerlimit) => {
    if (limitStart === buttonTimerlimit) {
      return "active-button";
    }
    return "inactive-button";
  };

  const getSoundClass = (mode) => {
    if (mode) {
      return "sound-button";
    }
    return "sound-button-deactive";
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
