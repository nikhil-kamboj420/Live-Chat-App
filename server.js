const express = require('express');
const { WebSocketServer } = require('ws');
const path = require('path');

const app = express();
const PORT = 5500;

app.use(express.static(path.join(__dirname, 'public')));

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

const wss = new WebSocketServer({ server });

const rooms = {}; // { roomName: [ { username, socket } ] }

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    const message = JSON.parse(data);

    switch (message.type) {
      case 'join':
        handleJoin(ws, message);
        break;

      case 'message':
        handleMessage(ws, message.text);
        break;

      case 'leave':
        handleLeave(ws);
        break;
    }
  });

  ws.on('close', () => handleLeave(ws));
});

function handleJoin(ws, { username, room }) {
  if (!username || !room) {
    ws.send(JSON.stringify({ type: 'error', message: 'Invalid username or room.' }));
    return;
  }

  // Ensure room exists
  if (!rooms[room]) rooms[room] = [];

  // Check if username is unique in the room
  const userExists = rooms[room].some((client) => client.username === username);
  if (userExists) {
    ws.send(JSON.stringify({ type: 'error', message: 'Username already taken in this room.' }));
    ws.close();
    return;
  }

  // Store user and room data
  ws.username = username;
  ws.room = room;
  rooms[room].push({ username, socket: ws });

  broadcast(room, {
    type: 'system',
    message: `${username} joined the room.`,
  });

  ws.send(
    JSON.stringify({
      type: 'success',
      message: `Welcome to the room, ${username}!`,
    })
  );
}

function handleMessage(ws, text) {
  if (!ws.room || !ws.username) return;

  broadcast(ws.room, {
    type: 'chat',
    username: ws.username,
    message: text,
    timestamp: new Date().toLocaleTimeString(),
  });
}

function handleLeave(ws) {
  if (!ws.room || !ws.username) return;

  rooms[ws.room] = rooms[ws.room].filter((client) => client.socket !== ws);

  broadcast(ws.room, {
    type: 'system',
    message: `${ws.username} left the room.`,
  });
}

function broadcast(room, message) {
  if (!rooms[room]) return;

  rooms[room].forEach((client) => {
    client.socket.send(JSON.stringify(message));
  });
}
