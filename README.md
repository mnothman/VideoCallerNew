Videocaller with different stack. Less complex than last

my-video-chat-app/
├─ server/
│  ├─ package.json
│  ├─ server.js
│  └─ ...other server files later on 
└─ client/
   ├─ package.json
   ├─ public/
   ├─ src/
   │  ├─ App.js
   │  ├─ index.js
   │  ├─ components/
   │  │  ├─ VideoChat.js
   │  │  ├─ ChatRoom.js
   │  │  └─ ...
   └─ ...other client files later on 

1.
cd server 
npm install
npm start

2.
cd client
npm install
npm start