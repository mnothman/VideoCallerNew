Videocaller with different stack. Less complex than last <br/>
 <br/>
my-video-chat-app/ <br/>
├─ server/ <br/>
│  ├─ package.json <br/>
│  ├─ server.js <br/>
│  └─ ...other server files later on  <br/>
└─ client/ <br/>
   ├─ package.json <br/>
   ├─ public/ <br/>
   ├─ src/ <br/>
   │  ├─ App.js <br/>
   │  ├─ index.js <br/>
   │  ├─ components/ <br/>
   │  │  ├─ VideoChat.js <br/>
   │  │  ├─ ChatRoom.js <br/>
   │  │  └─ ... <br/>
   └─ ...other client files later on  <br/>
 <br/>
1. <br/>
cd server  <br/>
npm install <br/>
npm start <br/>
 <br/>
2. <br/>
cd client <br/>
npm install <br/>
npm start <br/>