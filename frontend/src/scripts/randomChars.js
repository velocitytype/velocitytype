// generates random num between given range
const generateNum = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

const nums = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
const punctuations = ["!", "&", "'", "@", ".", "?", ","]

// generate random characters from given array
const generateChars = (arr, min, max) => {
    const length = generateNum(min, max);
    var chars = "";
    for(let i=0;i<length;i++){
        chars += arr[generateNum(0, arr.length - 1)]
    }
    return chars
}

// generates random numbers and symbols
const generateNumChars = (min, max) => generateChars(nums, min, max)
const generatePunctuationChars = (min, max) => generateChars(punctuations, min, max)

export { generateNumChars, generatePunctuationChars, generateNum };

