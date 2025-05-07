const socket = io("https://private-message-fyap.onrender.com");
const chatBox = document.getElementById("chat-box");
const usernameInput = document.getElementById("username");
const setUsernameBtn = document.getElementById("setUsername");
const messageInput = document.getElementById("message");
const receiverInput = document.getElementById("receiver");
const sendBtn = document.getElementById("send");
const sendFileBtn = document.getElementById("sendFile");
const fileInput = document.getElementById("fileInput");
const myIDSpan = document.getElementById("myID");
const typingIndicator = document.getElementById("typing-indicator");

let currentUserID = localStorage.getItem("userID") || generateUserID();
let currentUsername = localStorage.getItem("username") || "";
let isTyping = false;

// Function to generate a unique user ID
function generateUserID() {
    const newID = "user-" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("userID", newID);
    return newID;
}

// Function to display a message in the chat box
function displayMessage(sender, message, time, isSelf = false) {
    const senderDisplay = isSelf ? "You" : sender;
    const messageElement = document.createElement("p");
    messageElement.innerHTML = `<strong>${senderDisplay}:</strong> ${message} <span class="time">${time}</span>`;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to bottom
}

// Function to handle setting the username
function handleSetUsername() {
    const newUsername = usernameInput.value.trim();
    if (newUsername) {
        localStorage.setItem("username", newUsername);
        currentUsername = newUsername;
        socket.emit("setUsername", currentUsername);
        alert(`Username set to: ${currentUsername}`);
    }
}

// Function to handle sending a private message
function handleSendMessage() {
    const messageText = messageInput.value.trim();
    const receiverID = receiverInput.value.trim();
    const currentTime = new Date().toLocaleTimeString();

    if (messageText && receiverID && currentUsername) {
        socket.emit("privateMessage", {
            sender: currentUserID,
            receiver: receiverID,
            message: messageText,
            time: currentTime,
            senderName: currentUsername,
        });
        displayMessage("You", messageText, currentTime, true);
        messageInput.value = "";
    }
}

// Function to handle typing indication
function handleTyping() {
    const receiverID = receiverInput.value.trim();
    if (currentUsername && receiverID && !isTyping) {
        socket.emit("typing", { sender: currentUserID, receiver: receiverID, senderName: currentUsername });
        isTyping = true;
        setTimeout(() => {
            isTyping = false;
        }, 1500); // Consider a "stopped typing" event for better accuracy
    }
}

// Function to handle sending a file
function handleSendFile() {
    const file = fileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
            socket.emit("fileUpload", {
                sender: currentUserID,
                receiver: receiverInput.value,
                fileName: file.name,
                fileUrl: event.target.result,
                time: new Date().toLocaleTimeString(),
                senderName: currentUsername,
            });
        };
        reader.readAsDataURL(file);
        // Consider adding progress indication for larger files
    }
}

// Event Listeners
setUsernameBtn.addEventListener("click", handleSetUsername);
sendBtn.addEventListener("click", handleSendMessage);
messageInput.addEventListener("input", handleTyping);
sendFileBtn.addEventListener("click", handleSendFile);

// Socket.IO Event Handlers
socket.on("connect", () => {
    console.log("Connected to the server");
    myIDSpan.textContent = currentUserID;
    if (currentUsername) {
        socket.emit("setUsername", currentUsername);
    }
});

socket.on("disconnect", () => {
    console.log("Disconnected from the server");
});

socket.on("privateMessage", ({ sender, senderName, message, time }) => {
    const senderDisplay = sender === currentUserID ? "You" : senderName || sender;
    displayMessage(senderDisplay, message, time, sender === currentUserID);
});

socket.on("fileReceived", ({ sender, senderName, fileName, fileUrl, time }) => {
    const senderDisplay = sender === currentUserID ? "You" : senderName || sender;
    const fileLink = `<a href="${fileUrl}" target="_blank" download="${fileName}">${fileName}</a>`;
    displayMessage(senderDisplay, `Sent a file: ${fileLink}`, time, sender === currentUserID);
});

socket.on("typing", (data) => {
    if (receiverInput.value.trim() === data.sender && data.senderName !== currentUsername) {
        typingIndicator.textContent = `${data.senderName} is typing...`;
        setTimeout(() => {
            typingIndicator.textContent = "";
        }, 1500); // Increased duration slightly
    }
});

socket.on("notification", ({ senderName, message }) => {
    console.log(`Notification from ${senderName}: ${message}`);
    // Implement a more user-friendly notification display
});

// Initialization
myIDSpan.textContent = currentUserID;
usernameInput.value = currentUsername;
if (currentUsername) {
    socket.emit("setUsername", currentUsername);
}
