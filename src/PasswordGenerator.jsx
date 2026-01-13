import React, { useCallback, useEffect, useMemo, useState } from "react";

const HISTORY_KEY = "password_history_v1";
const HISTORY_LIMIT = 10;

// Preferences storage
const PREFS_KEY = "password_prefs_v1";

const PasswordGenerator = () => {
  const [length, setLength] = useState(10);
  const [numberAllowed, setNumberAllowed] = useState(false);
  const [characterAllowed, setCharacterAllowed] = useState(false);

  // Pronounceable option
  const [pronounceable, setPronounceable] = useState(false);

  // Exclude ambiguous characters (ON by default)
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(true);

  const [password, setPassword] = useState("");
  const [passwordCount, setPasswordCount] = useState(3);
  const [passwordList, setPasswordList] = useState([]);

  const [copied, setCopied] = useState(false);
  const [strength, setStrength] = useState("");
  const [error, setError] = useState("");

  // Restrictions (your existing ones)
  const [restrictConfusingChars, setRestrictConfusingChars] = useState(false);
  const [avoidOandZeroTogether, setAvoidOandZeroTogether] = useState(false);

  // Password history (localStorage)
  const [history, setHistory] = useState([]);

  // Load preferences on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      const prefs = raw ? JSON.parse(raw) : null;

      if (prefs && typeof prefs === "object") {
        if (Number.isFinite(prefs.length)) setLength(prefs.length);
        if (typeof prefs.numberAllowed === "boolean") setNumberAllowed(prefs.numberAllowed);
        if (typeof prefs.characterAllowed === "boolean") setCharacterAllowed(prefs.characterAllowed);
        if (typeof prefs.pronounceable === "boolean") setPronounceable(prefs.pronounceable);
        if (typeof prefs.excludeAmbiguous === "boolean") setExcludeAmbiguous(prefs.excludeAmbiguous);
        if (Number.isFinite(prefs.passwordCount)) setPasswordCount(prefs.passwordCount);
        if (typeof prefs.restrictConfusingChars === "boolean") setRestrictConfusingChars(prefs.restrictConfusingChars);
        if (typeof prefs.avoidOandZeroTogether === "boolean") setAvoidOandZeroTogether(prefs.avoidOandZeroTogether);
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist preferences whenever they change
  useEffect(() => {
    try {
      const prefs = {
        length,
        numberAllowed,
        characterAllowed,
        pronounceable,
        excludeAmbiguous,
        passwordCount,
        restrictConfusingChars,
        avoidOandZeroTogether,
      };
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
      // ignore
    }
  }, [
    length,
    numberAllowed,
    characterAllowed,
    pronounceable,
    excludeAmbiguous,
    passwordCount,
    restrictConfusingChars,
    avoidOandZeroTogether,
  ]);

  const resetPreferences = () => {
    // defaults (matches your initial state)
    setLength(10);
    setNumberAllowed(false);
    setCharacterAllowed(false);
    setPronounceable(false);
    setExcludeAmbiguous(true);
    setPasswordCount(3);
    setRestrictConfusingChars(false);
    setAvoidOandZeroTogether(false);

    try {
      localStorage.removeItem(PREFS_KEY);
    } catch {
      // ignore
    }
  };

  // History load/save
  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) setHistory(parsed);
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {
      // ignore
    }
  }, [history]);

  const addToHistory = (passwords) => {
    if (!Array.isArray(passwords) || passwords.length === 0) return;

    const entries = passwords.map((pw) => ({
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      value: pw,
      createdAt: new Date().toISOString(),
    }));

    setHistory((prev) => {
      const combined = [...entries, ...prev];
      const seen = new Set();
      const deduped = [];

      for (const item of combined) {
        if (!item?.value) continue;
        if (seen.has(item.value)) continue;
        seen.add(item.value);
        deduped.push(item);
        if (deduped.length >= HISTORY_LIMIT) break;
      }

      return deduped;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      // ignore
    }
  };

  // Secure random helpers
  const getSecureRandomIndex = (max) => {
    if (!Number.isFinite(max) || max <= 0) return 0;
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] % max;
  };

  const securePick = (str) => str[getSecureRandomIndex(str.length)];

  const secureShuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = getSecureRandomIndex(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // Copy-to-clipboard
  const copyPassword = async () => {
    const text = passwordList.length > 0 ? passwordList.join("\n") : password;
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy to clipboard. Please copy manually.");
    }
  };

  const copyHistoryItem = async (pw) => {
    if (!pw) return;
    try {
      await navigator.clipboard.writeText(pw);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy to clipboard. Please copy manually.");
    }
  };

  // Password generation
  const passwordGenerator = useCallback(() => {
    const len = Number(length);
    const count = Math.min(3, Math.max(1, Number(passwordCount) || 1));

    if (!pronounceable && !numberAllowed && !characterAllowed) {
      setError("Select Pronounceable, Numbers, or Special Characters before generating a password.");
      return;
    }

    if (!Number.isFinite(len) || len < 6 || len > 100) {
      setError("Password length must be between 6 and 100.");
      return;
    }

    setError("");

    const specials = "!@#$%^&*()_+-={}[]<>?";

    // Character pools
    const lowerBase = "abcdefghijklmnopqrstuvwxyz";
    const upperBase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numsBase = "0123456789";

    // Ambiguous chars to remove when excludeAmbiguous is ON
    const AMBIGUOUS = new Set(["O", "0", "I", "l", "1"]);

    const stripAmbiguous = (str) =>
      excludeAmbiguous ? [...str].filter((ch) => !AMBIGUOUS.has(ch)).join("") : str;

    // Apply default ambiguous exclusion to base pools
    const lower = stripAmbiguous(lowerBase);
    const upper = stripAmbiguous(upperBase);
    const nums = stripAmbiguous(numsBase);

    // Your existing restriction still works (extra safety)
    const confusingSet = new Set(["i", "l", "1"]);
    const avoidO = avoidOandZeroTogether && numberAllowed;

    const vowelsBase = avoidO ? "aeiuy" : "aeiouy";
    const consonantsBase = avoidO ? "bcdfghjklmnpqrstvwxz" : "bcdfghjklmnpqrstvwxz";

    // Also apply default ambiguous exclusion to pronounceable pools
    const vowels0 = stripAmbiguous(vowelsBase);
    const consonants0 = stripAmbiguous(consonantsBase);

    const vowels = restrictConfusingChars ? vowels0.replace("i", "") : vowels0;
    const consonants = restrictConfusingChars ? consonants0.replace("l", "") : consonants0;

    const isValid = (pw) => {
      if (restrictConfusingChars) {
        let found = 0;
        for (const ch of pw) {
          if (confusingSet.has(ch)) {
            found += 1;
            if (found > 1) return false;
          }
        }
      }

      if (avoidOandZeroTogether) {
        const hasO = pw.includes("o") || pw.includes("O");
        const hasZero = pw.includes("0");
        if (hasO && hasZero) return false;
      }

      // Ensure no ambiguous chars if option is on
      if (excludeAmbiguous) {
        for (const ch of pw) {
          if (AMBIGUOUS.has(ch)) return false;
        }
      }

      return true;
    };

    const generatePronounceableBase = (targetLen) => {
      let out = "";
      const startWithConsonant = getSecureRandomIndex(2) === 0;

      for (let i = 0; i < targetLen; i++) {
        const pickFrom =
          i % 2 === 0
            ? startWithConsonant
              ? consonants
              : vowels
            : startWithConsonant
            ? vowels
            : consonants;

        out += securePick(pickFrom);
      }

      out = out.charAt(0).toUpperCase() + out.slice(1);
      return out;
    };

    const generateRandomMixed = (targetLen) => {
      let available = lower + upper;
      if (numberAllowed) available += nums;
      if (characterAllowed) available += specials;

      const chars = [securePick(lower), securePick(upper)];
      if (numberAllowed) chars.push(securePick(nums));
      if (characterAllowed) chars.push(securePick(specials));

      while (chars.length < targetLen) chars.push(securePick(available));
      return secureShuffle(chars).join("");
    };

    const buildOne = () => {
      const requiredExtras = (numberAllowed ? 1 : 0) + (characterAllowed ? 1 : 0);
      const baseLen = Math.max(1, len - requiredExtras);

      let base = pronounceable ? generatePronounceableBase(baseLen) : generateRandomMixed(baseLen);

      if (numberAllowed) base += securePick(nums);
      if (characterAllowed) base += securePick(specials);

      return base;
    };

    const MAX_ATTEMPTS = 1500;
    const list = [];

    for (let i = 0; i < count; i++) {
      let pw = "";
      let attempts = 0;

      do {
        pw = buildOne();
        attempts += 1;

        if (attempts > MAX_ATTEMPTS) {
          setError("Cannot generate password with current restrictions. Try relaxing some options.");
          return;
        }
      } while (!isValid(pw));

      list.push(pw);
    }

    if (count === 1) {
      setPassword(list[0]);
      setPasswordList([]);
      addToHistory([list[0]]);
    } else {
      setPasswordList(list);
      setPassword("");
      addToHistory(list);
    }
  }, [
    length,
    passwordCount,
    numberAllowed,
    characterAllowed,
    pronounceable,
    excludeAmbiguous,
    restrictConfusingChars,
    avoidOandZeroTogether,
  ]);

  // Strength Meter
  useEffect(() => {
    const len = Number(length);
    if (!Number.isFinite(len) || len <= 0) {
      setStrength("");
      return;
    }

    let size = 26 + 26;
    if (numberAllowed) size += 10;
    if (characterAllowed) size += "!@#$%^&*()_+-={}[]<>?".length;

    let effectiveSize = pronounceable ? Math.max(10, size * 0.6) : size;
    if (excludeAmbiguous) effectiveSize = Math.max(10, effectiveSize * 0.9);

    const bits = len * Math.log2(effectiveSize);

    let label = "Weak";
    if (bits >= 60) label = "Medium";
    if (bits >= 80) label = "Strong";
    if (bits >= 100) label = "Very Strong";

    setStrength(label);
  }, [length, numberAllowed, characterAllowed, pronounceable, excludeAmbiguous]);

  const strengthBar = useMemo(() => {
    let widthClass = "w-1/4";
    let colorClass = "bg-red-500";

    if (strength === "Medium") {
      widthClass = "w-1/2";
      colorClass = "bg-orange-500";
    } else if (strength === "Strong") {
      widthClass = "w-3/4";
      colorClass = "bg-yellow-500";
    } else if (strength === "Very Strong") {
      widthClass = "w-full";
      colorClass = "bg-green-500";
    }

    if (!strength) {
      widthClass = "w-0";
      colorClass = "bg-gray-300";
    }

    return { widthClass, colorClass };
  }, [strength]);

  const handleButtonClick = (e, action) => {
    if (e?.currentTarget?.classList) {
      e.currentTarget.classList.add("active-click");
      setTimeout(() => e.currentTarget.classList.remove("active-click"), 75);
    }

    if (action === "generate") passwordGenerator();
    if (action === "copy") copyPassword();
  };

  const resultsText = passwordList.length > 0 ? passwordList.join("\n") : password;

  return (
    <div className="container mx-auto mt-8">
      <h1 className="text-4xl font-bold text-center mb-8">Password Generator</h1>

      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
        <div className="p-8">
          <div className="mb-4">
            <label className="block text-gray-700 text-lg text-left font-bold mb-2" htmlFor="password">
              Results:
            </label>

            <div className="flex gap-2">
              <textarea
                className="shadow appearance-none border rounded h-24 w-full py-2 px-3 text-gray-700 leading-tight align-top focus:outline-none focus:shadow-outline resize-none"
                id="password"
                placeholder="Click 'Generate Password'"
                value={resultsText}
                readOnly
                rows={Math.min(3, passwordList.length || 1)}
              />

              <button
                type="button"
                onClick={(e) => handleButtonClick(e, "copy")}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition"
                disabled={!resultsText}
              >
                Copy
              </button>
            </div>

            <button
              onClick={(e) => handleButtonClick(e, "generate")}
              className="mb-4 w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition"
              type="button"
            >
              Generate Password
            </button>

            {copied ? (
              <p className="text-green-600 text-sm font-medium" role="status" aria-live="polite">
                ✔ Copied to clipboard!
              </p>
            ) : (
              <div style={{ height: 20 }} />
            )}

            {error && (
              <p className="w-72 mx-auto text-red-500 text-sm mt-2" role="alert">
                {error}
              </p>
            )}

            {/* Strength Meter + Bar */}
            <div className="mb-4">
              <p className="mb-2 text-sm text-gray-600">
                Password strength: <span className="font-bold">{strength || "—"}</span>
              </p>

              <div className="w-full h-3 bg-gray-200 rounded overflow-hidden" role="progressbar" aria-label="Password strength">
                <div className={`h-full ${strengthBar.widthClass} ${strengthBar.colorClass} transition-all duration-300`} />
              </div>
            </div>

            <div className="mb-6">
              <input
                className="w-full cursor-pointer"
                id="length"
                type="range"
                min="6"
                max="100"
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
              />
              <div className="mt-2">
                <label htmlFor="length">Length: {length}</label>
              </div>
            </div>

            <div className="mb-6">
              <label className="block mb-1 font-medium" htmlFor="passwordCount">
                How many passwords?
              </label>
              <input
                id="passwordCount"
                type="number"
                min="1"
                max="3"
                value={passwordCount}
                onChange={(e) => setPasswordCount(Number(e.target.value))}
                className="border p-2 rounded w-24"
              />
              <p className="text-xs text-gray-500 mt-1">Max 3 (copied as multiple lines).</p>
            </div>

            {/* Preferences actions */}
            <div className="mb-6 flex items-center gap-3">
              <button
                type="button"
                className="text-sm px-3 py-1 rounded border hover:bg-gray-50"
                onClick={resetPreferences}
                title="Resets options and clears saved preferences"
              >
                Reset saved preferences
              </button>
              <p className="text-xs text-gray-500">Preferences auto-save on change.</p>
            </div>

            {/* Pronounceable toggle */}
            <div className="mb-6 flex items-center gap-2">
              <input
                id="pronounceable"
                type="checkbox"
                className="h-4 w-4"
                checked={pronounceable}
                onChange={() => setPronounceable((v) => !v)}
              />
              <label htmlFor="pronounceable">
                Pronounceable password <span className="text-xs text-gray-500">(e.g. “Bamiro7!”)</span>
              </label>
            </div>

            {/* Exclude ambiguous toggle (default ON) */}
            <div className="mb-6 flex items-center gap-2">
              <input
                id="excludeAmbiguous"
                type="checkbox"
                className="h-4 w-4"
                checked={excludeAmbiguous}
                onChange={() => setExcludeAmbiguous((v) => !v)}
              />
              <label htmlFor="excludeAmbiguous">
                Exclude ambiguous characters <span className="text-xs text-gray-500">(O, 0, I, l, 1)</span>
              </label>
            </div>

            <div className="mb-4 flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={numberAllowed}
                id="numberInput"
                onChange={() => setNumberAllowed((v) => !v)}
              />
              <label htmlFor="numberInput">Include Numbers</label>
            </div>

            <div className="mb-6 flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={characterAllowed}
                id="characterInput"
                onChange={() => setCharacterAllowed((v) => !v)}
              />
              <label htmlFor="characterInput">Include Special Characters</label>
            </div>

            <div className="mb-6 flex items-center gap-2">
              <input
                id="restrictConfusingChars"
                type="checkbox"
                className="h-4 w-4"
                checked={restrictConfusingChars}
                onChange={() => setRestrictConfusingChars((v) => !v)}
              />
              <label htmlFor="restrictConfusingChars">
                Exclude multiple of: <span className="font-mono">i</span>, <span className="font-mono">l</span>,{" "}
                <span className="font-mono">1</span>
              </label>
            </div>

            <div className="mb-6 flex items-center gap-2">
              <input
                id="avoidOandZeroTogether"
                type="checkbox"
                className="h-4 w-4"
                checked={avoidOandZeroTogether}
                onChange={() => setAvoidOandZeroTogether((v) => !v)}
              />
              <label htmlFor="avoidOandZeroTogether">
                Avoid <span className="font-mono">o/O</span> and <span className="font-mono">0</span> together
              </label>
            </div>

            <p className="text-xs text-gray-500">
              Tip: For best security, use longer passwords and include numbers + special characters.
            </p>

            {/* Password History */}
            <div className="mt-8 border-t pt-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-gray-700">Recent Passwords</h2>
                <button
                  type="button"
                  onClick={clearHistory}
                  className="text-sm px-3 py-1 rounded border hover:bg-gray-50"
                  disabled={history.length === 0}
                >
                  Clear history
                </button>
              </div>

              {history.length === 0 ? (
                <p className="text-sm text-gray-500">No history yet. Generate a password to see it here.</p>
              ) : (
                <ul className="space-y-2">
                  {history.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-3 p-2 border rounded">
                      <code className="text-sm break-all">{item.value}</code>
                      <button
                        type="button"
                        onClick={() => copyHistoryItem(item.value)}
                        className="text-sm px-3 py-1 rounded bg-green-500 text-white hover:bg-green-600"
                      >
                        Copy
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordGenerator;
