import React, { useState, useEffect } from "react";
import io from "socket.io-client";

const SERVER_URL = "http://localhost:5000";
let socket;

const ChatRoom = ({ roomId, userName }) => {
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);

  useEffect(() => {
    socket = io(SERVER_URL, { transports: ["websocket"] });

    socket.emit("join-room", { roomId, userName });

    socket.on("receive-message", (data) => {
      setChatMessages((prev) => [...prev, data]);
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [roomId, userName]);

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit("send-message", { roomId, message, userName });
      setMessage("");
    }
  };

  return (
    <div style={{ width: "300px" }}>
      <h3>Chat Room</h3>
      <div
        style={{
          border: "1px solid #ccc",
          height: "300px",
          overflowY: "auto",
          marginBottom: "10px"
        }}
      >
        {chatMessages.map((msg, idx) => (
          <div key={idx} style={{ margin: "5px 0" }}>
            <strong>{msg.userName}:</strong> {msg.message}
            <span style={{ fontSize: "0.8rem", marginLeft: "10px", color: "#999" }}>
              {new Date(msg.time).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
      <input
        type="text"
        placeholder="Type message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            sendMessage();
          }
        }}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default ChatRoom;
