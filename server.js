const express = require('express');
const { WebSocketServer } = require('ws');
const path = require('path');

const app = express();
const PORT = 5500;

app.use(express.static(path.join(__dirname, 'public')));
// Define a route for the /room endpoint
app.get('/room', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chat.html')); // Serve the chat.html file
});

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

const wss = new WebSocketServer({ server });

const rooms = {}; // { roomName: [ { username, socket } ] }

wss.on('connection', (ws) => {
  ws.previousRoom = null; // Track the previous room for the user

  ws.on('message', (data) => {
    try {
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

        case 'getRooms':
          handleGetRooms(ws);
          break;

        default:
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid message type.' }));
      }
    } catch (error) {
      console.error(error);
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format.' }));
    }
  });

  ws.on('close', () => handleLeave(ws));
  ws.on('error', (error) => {
    console.error(error);
    handleLeave(ws);
  });

  ws.send(JSON.stringify({ type: 'connected', message: 'You are now connected!' }));
});

function handleJoin(ws, { username, room }) {
  if (!username || !room) {
    ws.send(JSON.stringify({ type: 'error', message: 'Invalid username or room.' }));
    return;
  }

  // Ensure room exists
  if (!rooms[room]) rooms[room] = [];

  // If the user is reconnecting to their previous room, remove them from the previous room
  if (ws.previousRoom && ws.previousRoom !== room) {
    handleLeave(ws);
  }

  // Check if username is unique in the room
  const userExistsInRoom = rooms[room].some((client) => client.username === username);
  
  // If the username already exists in a different room, close the connection
  if (userExistsInRoom && ws.previousRoom !== room) {
    ws.send(JSON.stringify({ type: 'error', message: 'Username already taken in this room.' }));
    ws.close();
    return;
  }

  // Store user and room data
  ws.username = username;
  ws.room = room;
  rooms[room].push({ username, socket: ws });

  // Update previousRoom to the current room
  ws.previousRoom = room;

  broadcast(room, {
    type: 'system',
    message: `${username} joined the ${room}.`,
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

function handleGetRooms(ws) {
  const availableRooms = Object.keys(rooms);
  ws.send(JSON.stringify({ type: 'roomsList', rooms: availableRooms }));
}