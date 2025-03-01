const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(cors());
app.use(express.static(path.join(__dirname))); // Serve static files

// Serve the private-message.html when visiting "/"
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "private-message.html"));
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  socket.emit("yourID", socket.id);

  socket.on("setUsername", (username) => {
    socket.username = username;
  });

  socket.on("privateMessage", ({ sender, receiver, message, time, senderName }) => {
    io.to(receiver).emit("privateMessage", { sender, senderName, message, time });
    io.to(receiver).emit("notification", { senderName, message });
  });

  socket.on("fileUpload", ({ sender, receiver, fileName, fileUrl, time, senderName }) => {
    io.to(receiver).emit("fileReceived", { sender, senderName, fileName, fileUrl, time });
    io.to(receiver).emit("notification", { senderName, message: `Sent a file: ${fileName}` });
  });

  socket.on("typing", ({ sender, receiver, senderName }) => {
    io.to(receiver).emit("typing", senderName);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

