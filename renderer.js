const storeKey = "tasks";

function loadTasks() {
    let tasks = localStorage.getItem(storeKey);
    return tasks ? JSON.parse(tasks) : [];
}

function saveTasks(tasks) {
    localStorage.setItem(storeKey, JSON.stringify(tasks));
}

function checkForTimeKeyword(content) {
    const timeKeywords = ["today", "tomorrow", "next week"];
    return timeKeywords.some(keyword => content.toLowerCase().includes(keyword));
}

let form = document.getElementById("new-form");

form.addEventListener("submit", (e) => {
    e.preventDefault();
    let content = document.getElementById("content").value;
    let contentLower = content.toLowerCase();
    let hasTimeKeyword = checkForTimeKeyword(contentLower);

    console.log(`Content: ${content}, Has Time Keyword: ${hasTimeKeyword}`);
});