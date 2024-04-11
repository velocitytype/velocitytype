import { useState, useEffect } from "react";

const useLocalValue = (defaultVal, key) => {
  const [localValue, setLocalValue] = useState(() => {
    const value = window.localStorage.getItem(key);
    if (value !== null && value !== "undefined"){
        return JSON.parse(value)
    } else {
        return defaultVal
    }
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(localValue));
  }, [key, localValue]);

  return [localValue, setLocalValue];
};

export default useLocalValue;
