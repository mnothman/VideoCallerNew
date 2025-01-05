import React, { useState } from "react";
import VideoChat from "./components/VideoChat";
import ChatRoom from "./components/ChatRoom";

function App() {
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");
  const [joined, setJoined] = useState(false);

  const handleJoin = () => {
    if (roomId.trim() && userName.trim()) {
      setJoined(true);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      {!joined ? (
        <div>
          <h2>Join a Meeting</h2>
          <input
            type="text"
            placeholder="Meeting ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <input
            type="text"
            placeholder="Your Name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
          <button onClick={handleJoin}>Join</button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: "20px" }}>
          <VideoChat roomId={roomId} userName={userName} />
          <ChatRoom roomId={roomId} userName={userName} />
        </div>
      )}
    </div>
  );
}

export default App;
