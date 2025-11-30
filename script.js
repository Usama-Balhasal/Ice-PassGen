// DOM Elements
const passwordOutput = document.getElementById('password-output');
const generateBtn = document.getElementById('generate-btn');
const copyBtn = document.getElementById('copy-btn');
const downloadBtn = document.getElementById('download-btn');
const lengthSlider = document.getElementById('length-slider');
const lengthValue = document.getElementById('length-value');
const themeToggle = document.getElementById('theme-toggle');
const modeRadios = document.querySelectorAll('input[name="mode"]');
const strengthFill = document.getElementById('strength-fill');
const strengthText = document.getElementById('strength-text');
const strengthBar = document.querySelector('.strength-bar'); // For accessibility
const customWordInput = document.getElementById('custom-word');
const addWordBtn = document.getElementById('add-word-btn');
const wordList = document.getElementById('word-list');
const optionCheckboxes = document.querySelectorAll('.character-options input[type="checkbox"]');

// Character Sets - **Improved for security/ambiguity**
const charSets = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    // Ambiguous characters removed: 'l', '1', 'I', 'o', '0', 'O'
    uppercaseAmbiguous: 'ABCDEFGHJKMNPQRSTUVWXYZ',
    lowercaseAmbiguous: 'abcdefghjkmnpqrstuvwxyz',
    numbersAmbiguous: '23456789'
};

// Custom words array
let customWords = [];

// --- Helper Functions ---

/**
 * Generates a cryptographically secure random number in a given range.
 * @param {number} max - The upper bound (exclusive).
 * @returns {number} A secure random integer.
 */
function secureRandom(max) {
    const arr = new Uint32Array(1);
    // Use Web Crypto API for cryptographically secure random number generation
    window.crypto.getRandomValues(arr);
    return arr[0] % max;
}


/**
 * Calculates Shannon Entropy for password strength.
 * Entropy (bits) = log2(Possibilities^Length)
 * @param {string} password - The generated password string.
 * @param {number} charsetSize - The size of the character set used.
 * @returns {number} The entropy in bits.
 */
function calculateEntropy(password, charsetSize) {
    if (password.length === 0 || charsetSize <= 1) return 0;
    // H = L * log2(N) where L is length, N is charset size
    const entropy = password.length * Math.log2(charsetSize);
    return entropy;
}

/**
 * Updates the visual strength meter based on entropy.
 * @param {string} password - The password string.
 */
function updateStrengthMeter(password) {
    const mode = document.querySelector('input[name="mode"]:checked').value;
    const { chars, size } = getCharacterSet(mode);
    const entropy = calculateEntropy(password, size);

    let strength = 'Weak';
    let fillWidth = 0;
    let fillColor = '#ff4d4d'; // Red

    // Criteria based on common security standards (Adjusted from Zxcvbn)
    if (entropy < 28) {
        strength = 'Weak';
        fillWidth = 25;
        fillColor = '#ff4d4d'; // Red
    } else if (entropy < 60) {
        strength = 'Fair';
        fillWidth = 50;
        fillColor = '#ffc04d'; // Orange
    } else if (entropy < 80) {
        strength = 'Good';
        fillWidth = 75;
        fillColor = '#80d4ff'; // Blue/Cyan
    } else {
        strength = 'Strong';
        fillWidth = 100;
        fillColor = '#4dff88'; // Green
    }

    strengthFill.style.width = `${fillWidth}%`;
    strengthFill.style.backgroundColor = fillColor;
    strengthText.textContent = `Password Strength: ${strength} (${Math.round(entropy)} bits)`;
    strengthBar.setAttribute('aria-valuenow', fillWidth);
}

/**
 * Determines the character set and its size based on current settings.
 * @param {string} mode - 'password' or 'pin'.
 * @returns {{chars: string, size: number}} The combined character set string and its size.
 */
function getCharacterSet(mode) {
    const length = parseInt(lengthSlider.value);
    const includeUppercase = document.getElementById('uppercase').checked;
    const includeLowercase = document.getElementById('lowercase').checked;
    const includeNumbers = document.getElementById('numbers').checked;
    const includeSymbols = document.getElementById('symbols').checked;
    const avoidAmbiguous = document.getElementById('avoid-ambiguous').checked;

    let chars = '';
    let size = 0;

    if (mode === 'pin') {
        chars = avoidAmbiguous ? charSets.numbersAmbiguous : charSets.numbers;
        size = chars.length;
    } else {
        if (includeUppercase) {
            const set = avoidAmbiguous ? charSets.uppercaseAmbiguous : charSets.uppercase;
            chars += set;
            size += set.length;
        }
        if (includeLowercase) {
            const set = avoidAmbiguous ? charSets.lowercaseAmbiguous : charSets.lowercase;
            chars += set;
            size += set.length;
        }
        if (includeNumbers) {
            const set = avoidAmbiguous ? charSets.numbersAmbiguous : charSets.numbers;
            chars += set;
            size += set.length;
        }
        if (includeSymbols) {
            chars += charSets.symbols;
            size += charSets.symbols.length;
        }
    }

    return { chars, size };
}

/**
 * Generates the password based on current settings and custom words.
 * @param {boolean} [isPreview=false] - Whether this is a preview generation for strength calculation.
 * @returns {string} The generated password.
 */
function generatePassword(isPreview = false) {
    const mode = document.querySelector('input[name="mode"]:checked').value;
    const length = parseInt(lengthSlider.value);
    const { chars } = getCharacterSet(mode);

    if (chars === '') {
        passwordOutput.value = 'Select character types';
        updateStrengthMeter('');
        return '';
    }

    let password = '';

    // Step 1: Add custom words, if any
    let passwordCore = '';
    let requiredLength = length;
    
    // Shuffle custom words and add to the core password
    if (customWords.length > 0 && mode === 'password') {
        const shuffledWords = [...customWords].sort(() => 0.5 - Math.random());
        passwordCore = shuffledWords.join('-'); // Use a separator for readability
        requiredLength = Math.max(0, length - passwordCore.length - (shuffledWords.length > 0 ? shuffledWords.length - 1 : 0));
        
        // Truncate custom word part if it's longer than the max length
        if (passwordCore.length > length) {
            passwordCore = passwordCore.substring(0, length);
            requiredLength = 0;
        }
    }

    // Step 2: Fill remaining length with random characters
    let randomChars = '';
    const buffer = new Uint32Array(requiredLength);
    if (requiredLength > 0 && window.crypto) {
        window.crypto.getRandomValues(buffer);
        for (let i = 0; i < requiredLength; i++) {
            // Use the secure random number from the buffer
            randomChars += chars[buffer[i] % chars.length];
        }
    } else {
        // Fallback for environments without crypto (shouldn't happen in modern browsers)
        for (let i = 0; i < requiredLength; i++) {
            randomChars += chars[Math.floor(Math.random() * chars.length)];
        }
    }

    // Step 3: Combine and shuffle the random part with the custom word part (if any)
    let finalCharsArray = [];
    if (passwordCore.length > 0 && randomChars.length > 0) {
        // Simple interleave: put custom word at start, mix random chars after
        // A simple concatenation is often better for diceware style passphrases.
        // For a mixed password, let's just concatenate and ensure length is correct.
        password = passwordCore + randomChars;
    } else if (passwordCore.length > 0) {
        password = passwordCore;
    } else {
        password = randomChars;
    }
    
    // Step 4: Final length check and output
    password = password.substring(0, length);
    
    if (!isPreview) {
        passwordOutput.value = password;
        updateStrengthMeter(password);
    }
    
    return password;
}

/**
 * Copies the generated password to the clipboard.
 */
async function copyPassword() {
    try {
        await navigator.clipboard.writeText(passwordOutput.value);
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
    } catch (err) {
        alert('Failed to copy password: ' + err);
    }
}

/**
 * Downloads the generated password as a text file.
 */
function downloadPassword() {
    const password = passwordOutput.value;
    if (!password || password === 'Select character types') {
        alert('Please generate a password first.');
        return;
    }
    
    try {
        const blob = new Blob([`Generated Password: ${password}\n\n*Reminder: This is a sensitive file. Delete it immediately after use.*\n`], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ice-password.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (err) {
        alert('Failed to download password: ' + err);
    }
}

/**
 * Manages the custom word input and display.
 */
function manageCustomWords() {
    const word = customWordInput.value.trim();
    
    if (word && !customWords.includes(word)) {
        customWords.push(word);
        customWordInput.value = '';
        renderWordList();
        generatePassword(); // Regenerate password with new word
    } else if (customWords.includes(word)) {
        alert('Word already added!');
    }
}

/**
 * Renders the list of custom words as removable tags.
 */
function renderWordList() {
    wordList.innerHTML = '';
    customWords.forEach(word => {
        const tag = document.createElement('span');
        tag.className = 'word-tag';
        tag.textContent = word;
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-word';
        removeBtn.textContent = 'x';
        removeBtn.title = `Remove ${word}`;
        removeBtn.onclick = () => {
            customWords = customWords.filter(w => w !== word);
            renderWordList();
            generatePassword(); // Regenerate password after removal
        };

        tag.appendChild(removeBtn);
        wordList.appendChild(tag);
    });
}

/**
 * Toggles dark/light mode and saves preference.
 */
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    themeToggle.textContent = isDarkMode ? 'Toggle Light Mode' : 'Toggle Dark Mode';
}

/**
 * Sets initial theme preference.
 */
function setInitialTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.textContent = 'Toggle Light Mode';
    } else {
        themeToggle.textContent = 'Toggle Dark Mode';
    }
}

/**
 * Handles logic when the mode (Password/PIN) is changed.
 * Disables non-PIN options when PIN is selected.
 */
function handleModeChange() {
    const isPinMode = document.getElementById('mode-pin').checked;
    
    // Get all checkboxes except 'avoid-ambiguous'
    const nonPinOptions = Array.from(optionCheckboxes).filter(cb => cb.id !== 'avoid-ambiguous');
    
    nonPinOptions.forEach(checkbox => {
        checkbox.disabled = isPinMode;
        if (isPinMode) {
            // Uncheck and grey out non-PIN options
            checkbox.checked = false;
        } else {
            // Restore default checks for password mode
            if (['uppercase', 'lowercase', 'numbers'].includes(checkbox.id)) {
                checkbox.checked = true;
            }
        }
    });

    // Handle numbers checkbox for PIN mode
    const numbersCheckbox = document.getElementById('numbers');
    numbersCheckbox.checked = true;
    numbersCheckbox.disabled = isPinMode;


    // Update the custom words section visibility
    const customWordsSection = document.querySelector('.custom-words-section');
    customWordsSection.style.display = isPinMode ? 'none' : 'block';
    
    generatePassword();
}


// --- Event Listeners and Initialization ---

// Initialize theme
setInitialTheme();

// Attach listeners
generateBtn.addEventListener('click', () => generatePassword());
copyBtn.addEventListener('click', copyPassword);
downloadBtn.addEventListener('click', downloadPassword);
themeToggle.addEventListener('click', (e) => {
    e.preventDefault();
    toggleTheme();
});

// Length slider listener
lengthSlider.addEventListener('input', () => {
    lengthValue.textContent = lengthSlider.value;
    generatePassword(); // Generate a new password immediately upon length change
});

// Custom word listeners
addWordBtn.addEventListener('click', manageCustomWords);
customWordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        manageCustomWords();
    }
});

// Mode switch listener
modeRadios.forEach(radio => radio.addEventListener('change', handleModeChange));

// Character option listeners
optionCheckboxes.forEach(checkbox => {
    // Only attach listener if it's not the mode that forces the check state (like numbers in PIN mode)
    checkbox.addEventListener('change', () => {
        // Prevent all options from being unchecked for password mode
        const checkedCount = Array.from(optionCheckboxes).filter(cb => cb.checked).length;
        if (checkedCount === 0 && document.getElementById('mode-password').checked) {
            alert('At least one character type must be selected for Password mode.');
            checkbox.checked = true; // Revert the uncheck
        }
        generatePassword();
    });
});

// Initial setup
handleModeChange(); // Set initial mode (which calls generatePassword)