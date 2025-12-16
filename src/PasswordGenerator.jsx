import React, { useState, useCallback } from 'react';

const PasswordGenerator = () => {
    const [length, setLength] = useState(10);
    const [numberAllowed, setNumberAllowed] = useState(false);
    const [characterAllowed, setCharacterAllowed] = useState(false);
    const [password, setPassword] = useState('');
    const [copied, setCopied] = useState(false);
    const [strength, setStrength] = useState('');
    const [error, setError] = useState("");
    const [passwordCount, setPasswordCount] = useState(3);
    const [passwordList, setPasswordList] = useState([]);

    // Declare confusing characters not to be placed together
    const [restrictConfusingChars, setRestrictConfusingChars] = useState(false);
    const [avoidOandZeroTogether, setAvoidOandZeroTogether] = useState(false);

    // Copy-to-clipboard handler implementation
    const copyPassword = () => {
        const text = passwordList.length > 0 ? passwordList.join('\n') : password;
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Password generation logic
    const passwordGenerator = useCallback(() => {

        // Prevent generation if numbers or special characters are not allowed
        if (!numberAllowed && !characterAllowed) {
            setError("Please select Numbers or Special Characters before generating a password.");
            return;
        }

        setError("");

        // Ensure the password length is valid
        if (length < 6 || length > 100) {
            alert("Password length must be between 6 and 100.");
            return;
        }

        let lower = "abcdefghijklmnopqrstuvwxyz";
        let upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        let nums = "0123456789";
        let specials = "!@#$%^&*()_+-={}[]<>?";

        // Build the base allowed characters
        let available = lower + upper;
        if (numberAllowed) available += nums;
        if (characterAllowed) available += specials;

        const confusingGroup = ["i", "l", "1"];

        function isValid(password) {
            // No more than one of i,l,1
            if (restrictConfusingChars) {
                let count = 0;
                for (let ch of password) {
                    if (confusingGroup.includes(ch)) count++;
                    if (count > 1) return false;
                }
            }

            // Cannot include both "o" and "0"
            if (avoidOandZeroTogether) {
                const hasO = password.includes("o") || password.includes("O");
                const hasZero = password.includes("0");
                if (hasO && hasZero) return false;
            }

            return true;
        }

        let password = "";
        let attempts = 0;

        // Loop until valid — no recursion
        do {
            attempts++;
            let generated = [];

            // Always include at least one lowercase + uppercase
            generated.push(lower[Math.floor(Math.random() * lower.length)]);
            generated.push(upper[Math.floor(Math.random() * upper.length)]);

            if (numberAllowed)
                generated.push(nums[Math.floor(Math.random() * nums.length)]);

            if (characterAllowed)
                generated.push(specials[Math.floor(Math.random() * specials.length)]);

            for (let i = generated.length; i < Number(length); i++) {
                generated.push(available[Math.floor(Math.random() * available.length)]);
            }

            // Shuffle final password
            password = generated
                .sort(() => Math.random() - 0.5)
                .join("");

        } while (!isValid(password)); // Re-run ONLY if requirements fail

        if (passwordCount === 1) {
            // Default single password
            setPassword(password);
            setPasswordList([]);
        } else {
            // Generate multiple passwords
            const list = [];
            for (let i = 0; i < passwordCount; i++) {
                let newPass;
                do {
                    let generated = [];
                    generated.push(lower[Math.floor(Math.random() * lower.length)]);
                    generated.push(upper[Math.floor(Math.random() * upper.length)]);

                    if (numberAllowed)
                        generated.push(nums[Math.floor(Math.random() * nums.length)]);

                    if (characterAllowed)
                        generated.push(specials[Math.floor(Math.random() * specials.length)]);

                    for (let j = generated.length; j < Number(length); j++) {
                        generated.push(available[Math.floor(Math.random() * available.length)]);
                    }

                    newPass = generated.sort(() => Math.random() - 0.5).join("");

                } while (!isValid(newPass));

                list.push(newPass);
            }

            setPasswordList(list);
            setPassword("");
        }

    },[length,numberAllowed,characterAllowed,restrictConfusingChars,avoidOandZeroTogether,setPassword]);

    const computeStrength = useCallback(() => {

        // Password strength meter
        let score = 0;
        if (length >= 12) score++;
        if (numberAllowed) score++;
        if (characterAllowed) score++;

        if (score === 0) setStrength("Weak");
        if (score === 1) setStrength("Medium");
        if (score === 2) setStrength("Strong");
        if (score === 3) setStrength("Very Strong");

    }, [length, numberAllowed, characterAllowed]);

    React.useEffect(() => {
        computeStrength();
    }, [length, numberAllowed, characterAllowed, computeStrength]);
    

    const handleButtonClick = (e, action) => {
        e.target.classList.add("active-click");
        setTimeout(() => e.target.classList.remove("active-click"), 75);

        if (action === "generate") passwordGenerator();
        if (action === "copy") copyPassword();
    };

    return (
        <div className="container mx-auto mt-8">
            <h1 className="text-4xl font-bold text-center mb-8">
                Password Generator
            </h1>

            <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
                <div className="p-8">

                    {/* Generated Password Display */}
                    <div className="mb-4">
                        <label className="block text-gray-700 text-lg text-left font-bold mb-2" htmlFor="password">
                            Results:
                        </label>
                        
                        <div className="flex gap-2">
                            <textarea
                                className="shadow appearance-none border rounded h-24 w-full py-2 px-3 text-gray-700 leading-tight align-top focus:outline-none focus:shadow-outline resize-none"
                                id="password"
                                placeholder="Click 'Generate Password'"
                                value={passwordList.length > 0 ? passwordList.join('\n') : password}
                                readOnly
                                rows={passwordList.length > 0 ? passwordList.length : 1}
                            />
                            <button
                                onClick={(e) => handleButtonClick(e, "copy")}
                                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition"
                            >
                                Copy
                            </button>
                        </div>

                        <div>
                            {!copied && (<br></br>)}
                            {copied && (
                                <p className="text-green-600 text-sm mt-2 font-medium">
                                    <br></br>
                                    ✔ Copied to clipboard!
                                </p>
                            )}
                        </div>
                        <br />

                        {/* Generate Button */}
                        <button 
                            onClick={(e) => handleButtonClick(e, "generate")}
                            className="mb-6 w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition" 
                            type="button"
                        >
                            Generate Password
                        </button>
                        <br /><br />
                        {error && (
                            <p className="w-72 mx-auto text-red-500 text-sm mt-2">{error}<br></br><br></br></p>
                        )}

                        {/* Strength meter + tooltip */}
                        <p className="mb-3 text-sm text-gray-600">
                            Password strength: <span className="font-bold">{strength}</span>
                        </p>

                        {/* Password Length */}
                        <div className="mb-6">
                            <input
                                className="w-full cursor-pointer"
                                id="length"
                                type="range"
                                min="6"
                                max="100"
                                value={length}
                                onChange={(e) => setLength(e.target.value)}
                            />
                            <br /><br />
                            <label>Length: {length}</label>
                        </div>

                        <div className="mb-6">
                            <label className="block mb-1 font-medium">How many passwords?</label>
                            <input
                                type="number"
                                min="1"
                                max="3"
                                value={passwordCount}
                                onChange={(e) => setPasswordCount(Number(e.target.value))}
                                className="border p-2 rounded w-24"
                            />
                        </div>
                    
                        {/* Include Numbers */}
                        <div className="mb-4 flex items-center gap-2">
                            <input
                                type="checkbox"
                                className="h-4 w-4"
                                checked={numberAllowed}
                                id="numberInput"
                                onChange={() => setNumberAllowed(!numberAllowed)}
                            />
                            <label htmlFor="numberInput">Include Numbers</label>
                        </div>

                        {/* Include Special Characters */}
                        <div className="mb-6 flex items-center gap-2">
                            <input
                                type="checkbox"
                                className="h-4 w-4"
                                checked={characterAllowed}
                                id="characterInput"
                                onChange={() => setCharacterAllowed(!characterAllowed)}
                            />
                            <label htmlFor="characterInput">Include Special Characters</label>
                        </div>

                        {/* Exclude Multiple Similar Characters */}
                        <div className="mb-6 flex items-center gap-2">
                            <input
                                type="checkbox"
                                className="h-4 w-4"
                                checked={restrictConfusingChars}
                                onChange={() => setRestrictConfusingChars(!restrictConfusingChars)}
                            />
                            <label htmlFor="restrictConfusingChars">Exclude Multiple Similar Characters ('i', 'l', '1')</label>
                        </div>

                        {/* Avoid O and Zero Together */}
                        <div className="mb-6 flex items-center gap-2">
                            <input
                                type="checkbox"
                                className="h-4 w-4"
                                checked={avoidOandZeroTogether}
                                onChange={() => setAvoidOandZeroTogether(!avoidOandZeroTogether)}
                            />
                            <label htmlFor="avoidOandZeroTogether">Avoid 'o' and '0' Together</label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PasswordGenerator;