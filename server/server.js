const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
});

// Store room and users, (user DB later)
const rooms = {};

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("join-room", ({ roomId, userName }) => {
    socket.join(roomId);
    console.log(`${userName} joined room: ${roomId}`);

    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }
    
    rooms[roomId].push({ socketId: socket.id, userName });

    socket.to(roomId).emit("user-connected", { socketId: socket.id, userName });

    io.to(socket.id).emit("all-users", rooms[roomId]);
  });

  socket.on("send-message", ({ roomId, message, userName }) => {
    const payload = {
      message,
      userName,
      time: new Date().toISOString()
    };
    io.in(roomId).emit("receive-message", payload);
  });

  socket.on("ice-candidate", ({ roomId, candidate }) => {
    socket.to(roomId).emit("ice-candidate", {
      candidate,
      from: socket.id,
    });
  });

  socket.on("offer", ({ roomId, offer }) => {
    socket.to(roomId).emit("offer", {
      offer,
      from: socket.id
    });
  });

  socket.on("answer", ({ roomId, answer }) => {
    socket.to(roomId).emit("answer", {
      answer,
      from: socket.id,
    });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);

    for (const roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter((user) => user.socketId !== socket.id);
      socket.to(roomId).emit("user-disconnected", socket.id);

      // Remove if room empty 
      if (rooms[roomId].length === 0) {
        delete rooms[roomId];
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
