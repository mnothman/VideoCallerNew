import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const SERVER_URL = "http://localhost:5000";

let socket;

const VideoChat = ({ roomId, userName }) => {
  const [localStream, setLocalStream] = useState(null);
  const [participants, setParticipants] = useState({});
  const [isMuted, setIsMuted] = useState(false);
  const peerConnectionsRef = useRef({});
  const localVideoRef = useRef(null);

  useEffect(() => {
    socket = io(SERVER_URL, { transports: ["websocket"] });

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setParticipants((prev) => ({
          ...prev,
          [socket.id]: {
            userName: userName,
            stream: stream,
          },
        }));
      })
      .catch((err) => {
        console.error("Error accessing media devices:", err);
        alert("Please ensure your camera/microphone are connected.");
      });

    socket.emit("join-room", { roomId, userName });

    // Listen for new connections and call user who just connected
    socket.on("user-connected", ({ socketId, userName }) => {
      console.log("User connected:", socketId, userName);
      setParticipants((prev) => ({
        ...prev,
        [socketId]: {
          userName: userName,
          stream: null,
        },
      }));
      callUser(socketId);
    });

    socket.on("all-users", (users) => {
      const existingUsers = {};
      users.forEach((user) => {
        existingUsers[user.socketId] = {
          userName: user.userName,
          stream: null,
        };
      });
      // Merge your own info
      existingUsers[socket.id] = {
        userName: userName,
        stream: localStream,
      };
      setParticipants(existingUsers);

      // Call all existing users (except yourself)
      users.forEach((user) => {
        if (user.socketId !== socket.id) {
          callUser(user.socketId);
        }
      });
    });

    socket.on("offer", handleReceiveOffer);
    socket.on("answer", handleReceiveAnswer);
    socket.on("ice-candidate", handleNewICECandidateMsg);
    socket.on("user-disconnected", handleUserDisconnected);

    return () => {
      if (socket) {
        socket.disconnect();
      }
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
    };
  }, []);

  const createPeerConnection = (remoteSocketId) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun1.l.google.com:19302",
        },
      ],
    });

    pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("Sending ICE candidate:", event.candidate);
          socket.emit("ice-candidate", { roomId, candidate: event.candidate });
        }
    };
      
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      console.log("Received track from", remoteSocketId);

      setParticipants((prev) => ({
        ...prev,
        [remoteSocketId]: {
          ...prev[remoteSocketId],
          stream: remoteStream,
        },
      }));
    };

    if (localStream) {
      localStream.getTracks().forEach((track) => {
        console.log("Tracks in localStream:", localStream.getTracks());
        pc.addTrack(track, localStream);
      });
    }

    return pc;
  };

  const callUser = async (remoteSocketId) => {
      if (peerConnectionsRef.current[remoteSocketId]) {
        console.warn("Connection already exists with", remoteSocketId);
        return;
      }
    
      console.log("Calling user:", remoteSocketId);
      const pc = createPeerConnection(remoteSocketId);
      peerConnectionsRef.current[remoteSocketId] = pc;
    
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("offer", { roomId, offer });
      } catch (err) {
        console.error("Error creating offer:", err);
      }
    };

  const handleReceiveOffer = async ({ offer, from }) => {
    console.log("Received offer from:", from);
  
    let pc = peerConnectionsRef.current[from];
    if (!pc) {
      pc = createPeerConnection(from);
      peerConnectionsRef.current[from] = pc;
    }
  
    if (pc.signalingState !== "stable") {
      console.warn(
        `Cannot set remote description for offer. Current signaling state: ${pc.signalingState}`
      );
      return;
    }
  
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { roomId, answer });
    } catch (error) {
      console.error("Error handling offer:", error);
    }
  };
  // Debugging 
  // const logSignalingState = (pc, label) => {
  //   console.log(`[${label}] Signaling state: ${pc.signalingState}`);
  // };
  
  const handleReceiveAnswer = async ({ answer, from }) => {
    console.log("Received answer from:", from);
  
    const pc = peerConnectionsRef.current[from];
    if (!pc) {
      console.error("No RTCPeerConnection exists for", from);
      return;
    }
  
    if (pc.signalingState !== "have-local-offer") {
      console.warn(
        `Cannot set remote description. Current signaling state: ${pc.signalingState}`
      );
      return;
    }
  
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      console.log("Remote description set successfully for", from);
    } catch (error) {
      console.error("Error setting remote description:", error);
    }
  };
  
  const handleNewICECandidateMsg = async ({ candidate, from }) => {
    const pc = peerConnectionsRef.current[from];
    if (!pc) return;
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error("Error adding received ICE candidate", error);
    }
  };

  const handleUserDisconnected = (socketId) => {
    if (peerConnectionsRef.current[socketId]) {
      peerConnectionsRef.current[socketId].close();
      delete peerConnectionsRef.current[socketId];
    }
    setParticipants((prev) => {
      const updated = { ...prev };
      delete updated[socketId];
      return updated;
    });
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  return (
    <div style={{ width: "600px" }}>
      <h3>Video Chat</h3>
      <div>
        <video ref={localVideoRef} autoPlay playsInline muted />
        <button onClick={toggleMute}>
          {isMuted ? "Unmute" : "Mute"}
        </button>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, 200px)",
          gridGap: "10px",
        }}
      >
        {Object.entries(participants).map(([id, participant]) => (
          <VideoTile
            key={id}
            userName={participant.userName}
            stream={participant.stream}
            isLocal={id === socket.id}
          />
        ))}
      </div>
    </div>
  );
};

const VideoTile = ({ userName, stream, isLocal }) => {
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
    if (audioRef.current && stream && !isLocal) {
      console.log(`Assigning audio stream for ${userName}`);
      audioRef.current.srcObject = stream;

      // Play the audio after assigning
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log(`Audio playing for ${userName}`);
          })
          .catch((error) => {
            console.error(`Audio playback error for ${userName}:`, error);
          });
      }
    }
  }, [stream]);

  return (
    <div style={{ position: "relative", backgroundColor: "#000" }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        style={{ width: "200px", height: "auto" }}
      ></video>
      {!isLocal && <audio ref={audioRef} autoPlay />}
      <div
        style={{
          position: "absolute",
          bottom: "5px",
          left: "5px",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          color: "#fff",
          padding: "2px 5px",
          borderRadius: "3px",
          fontSize: "0.8rem",
        }}
      >
        {userName} {isLocal ? "(You)" : ""}
      </div>
    </div>
  );
};

export default VideoChat;
