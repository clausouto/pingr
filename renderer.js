const storeKey = "tasks";
const TIME_PATTERNS = [
    {
        regex: /\b(?:dans|après)\s+(\d+)\s+(minutes?)\b/i,
        type: 'relative_minutes',
        unit: 'minutes'
    },
    {
        regex: /\b(?:dans|après)\s+(\d+)\s+(heures?)\b/i,
        type: 'relative_hours',
        unit: 'heures'
    },
    {
        regex: /\b(?:dans|après)\s+(\d+)\s+(jours?)\b/i,
        type: 'relative_days',
        unit: 'jours'
    },
    {
        regex: /\b(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\b/i,
        type: 'specific_day',
        unit: 'jour'
    }
];

function loadTasks() {
    let tasks = localStorage.getItem(storeKey);
    return tasks ? JSON.parse(tasks) : [];
}

function saveTasks(tasks) {
    localStorage.setItem(storeKey, JSON.stringify(tasks));
}

function analyzeTimeKeyword(content) {
    for (let pattern of TIME_PATTERNS) {
        let match = pattern.regex.exec(content);
        if (match) {
            return {
                found: true,
                type: pattern.type,
                unit: pattern.unit,
                match: match[0],
                value: match[1],
                originalText: match[0]
            };
        }
    }
    return { found: false };
}

let form = document.getElementById("form");

form.addEventListener("submit", (e) => {
    e.preventDefault();
    let content = document.getElementById("content").value;
    let contentLower = content.toLowerCase();
    let timeInfo = analyzeTimeKeyword(contentLower);
    window.remindersAPI.addTask({ content, timeInfo });
});