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
const customWordInput = document.getElementById('custom-word');
const addWordBtn = document.getElementById('add-word-btn');
const wordList = document.getElementById('word-list');

// Character Sets
const charSets = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    uppercaseAmbiguous: 'ABCDEFGHJKMNPQRSTUVWXYZ',
    lowercaseAmbiguous: 'abcdefghjkmnpqrstuvwxyz',
    numbersAmbiguous: '23456789'
};

// Custom words array
let customWords = [];

// Update length display
lengthSlider.addEventListener('input', () => {
    lengthValue.textContent = lengthSlider.value;
    updateStrengthMeter(passwordOutput.value);
});

// Generate password function
function generatePassword() {
    const mode = document.querySelector('input[name="mode"]:checked').value;
    const length = parseInt(lengthSlider.value);
    const includeUppercase = document.getElementById('uppercase').checked;
    const includeLowercase = document.getElementById('lowercase').checked;
    const includeNumbers = document.getElementById('numbers').checked;
    const includeSymbols = document.getElementById('symbols').checked;
    const avoidAmbiguous = document.getElementById('avoid-ambiguous').checked;

    let chars = '';

    if (mode === 'pin') {
        chars = avoidAmbiguous ? charSets.numbersAmbiguous : charSets.numbers;
    } else {
        if (includeUppercase) chars += avoidAmbiguous ? charSets.uppercaseAmbiguous : charSets.uppercase;
        if (includeLowercase) chars += avoidAmbiguous ? charSets.lowercaseAmbiguous : charSets.lowercase;
        if (includeNumbers) chars += avoidAmbiguous ? charSets.numbersAmbiguous : charSets.numbers;
        if (includeSymbols) chars += charSets.symbols;
    }

    if (chars === '') {
        alert('Please select at least one character type for password generation.');
        return;
    }

    let password = '';

    // Include custom words if any
    if (customWords.length > 0 && mode === 'password') {
        // Randomly insert custom words
        const numWords = Math.min(customWords.length, Math.floor(length / 4));
        const positions = [];
        
        for (let i = 0; i < numWords; i++) {
            let pos;
            do {
                pos = Math.floor(Math.random() * length);
            } while (positions.includes(pos));
            positions.push(pos);
        }

        positions.sort((a, b) => a - b);

        let wordIndex = 0;
        for (let i = 0; i < length; i++) {
            if (positions.includes(i) && wordIndex < customWords.length) {
                const word = customWords[wordIndex++];
                if (password.length + word.length <= length) {
                    password += word;
                    i += word.length - 1;
                } else {
                    password += chars[Math.floor(Math.random() * chars.length)];
                }
            } else {
                password += chars[Math.floor(Math.random() * chars.length)];
            }
        }
    } else {
        // Generate random password
        for (let i = 0; i < length; i++) {
            password += chars[Math.floor(Math.random() * chars.length)];
        }
    }

    passwordOutput.value = password;
    updateStrengthMeter(password);
}

// Update password strength meter
function updateStrengthMeter(password) {
    let score = 0;
    const length = password.length;

    if (length >= 8) score += 1;
    if (length >= 12) score += 1;
    if (length >= 16) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    let strength = 'Very Weak';
    let color = '#ff0000';

    if (score <= 2) {
        strength = 'Very Weak';
        color = '#ff0000';
    } else if (score <= 3) {
        strength = 'Weak';
        color = '#ff4500';
    } else if (score <= 4) {
        strength = 'Fair';
        color = '#ffa500';
    } else if (score <= 5) {
        strength = 'Good';
        color = '#90ee90';
    } else {
        strength = 'Strong';
        color = '#008000';
    }

    strengthFill.style.width = `${(score / 7) * 100}%`;
    strengthFill.style.backgroundColor = color;
    strengthText.textContent = `Password Strength: ${strength}`;
}

// Copy to clipboard
copyBtn.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(passwordOutput.value);
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
            copyBtn.textContent = 'Copy';
        }, 2000);
    } catch (err) {
        // Fallback for older browsers
        passwordOutput.select();
        document.execCommand('copy');
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
            copyBtn.textContent = 'Copy';
        }, 2000);
    }
});

// Download as .txt file
downloadBtn.addEventListener('click', () => {
    const password = passwordOutput.value;
    const blob = new Blob([password], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated-password.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

// Theme toggle
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    themeToggle.textContent = isDark ? 'Toggle Light Mode' : 'Toggle Dark Mode';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// Load saved theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    themeToggle.textContent = 'Toggle Light Mode';
}

// Add custom word
addWordBtn.addEventListener('click', () => {
    const word = customWordInput.value.trim();
    if (word && !customWords.includes(word)) {
        customWords.push(word);
        updateWordList();
        customWordInput.value = '';
    }
});

// Update word list display
function updateWordList() {
    wordList.innerHTML = '';
    customWords.forEach((word, index) => {
        const wordItem = document.createElement('div');
        wordItem.className = 'word-item';
        wordItem.innerHTML = `
            <span>${word}</span>
            <button onclick="removeWord(${index})">&times;</button>
        `;
        wordList.appendChild(wordItem);
    });
}

// Remove custom word
function removeWord(index) {
    customWords.splice(index, 1);
    updateWordList();
}

// Event listeners
generateBtn.addEventListener('click', generatePassword);

// Add event listeners for real-time strength updates
document.querySelectorAll('input[name="mode"]').forEach(radio => {
    radio.addEventListener('change', () => updateStrengthMeter(generatePasswordPreview()));
});

document.querySelectorAll('#settings input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', () => updateStrengthMeter(generatePasswordPreview()));
});

// Generate initial password
generatePassword();

// Helper function to generate preview password for strength calculation
function generatePasswordPreview() {
    const mode = document.querySelector('input[name="mode"]:checked').value;
    const length = parseInt(lengthSlider.value);
    const includeUppercase = document.getElementById('uppercase').checked;
    const includeLowercase = document.getElementById('lowercase').checked;
    const includeNumbers = document.getElementById('numbers').checked;
    const includeSymbols = document.getElementById('symbols').checked;
    const avoidAmbiguous = document.getElementById('avoid-ambiguous').checked;

    let chars = '';

    if (mode === 'pin') {
        chars = avoidAmbiguous ? charSets.numbersAmbiguous : charSets.numbers;
    } else {
        if (includeUppercase) chars += avoidAmbiguous ? charSets.uppercaseAmbiguous : charSets.uppercase;
        if (includeLowercase) chars += avoidAmbiguous ? charSets.lowercaseAmbiguous : charSets.lowercase;
        if (includeNumbers) chars += avoidAmbiguous ? charSets.numbersAmbiguous : charSets.numbers;
        if (includeSymbols) chars += charSets.symbols;
    }

    if (chars === '') return '';

    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars[Math.floor(Math.random() * chars.length)];
    }

    return password;
}