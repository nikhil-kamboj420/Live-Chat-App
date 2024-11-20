const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get("username");
const room = urlParams.get("room");

document.getElementById("roomName").innerText = `Room: ${room}`;

const ws = new WebSocket(`ws://${window.location.hostname}:5500`);
ws.onopen = () => {
  ws.send(JSON.stringify({ type: "join", username, room }));
  ws.send(JSON.stringify({ type: "getRooms" })); // Request available rooms
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data); // Parse JSON instead of stringifying
  if (message.type === "roomsList") {
    displayAvailableRooms(message.rooms); // Implement this function to update the UI
  }
  const chatMessages = document.getElementById("chatMessages");

  if (message.type === "error") {
    alert(message.message);
    window.location.href = "/";
    return;
  }

  const messageDiv = document.createElement("div");
  if (message.type === "chat") {
    messageDiv.innerHTML = `<strong>${message.username}</strong>: ${message.message} <small>${message.timestamp}</small>`;
  } else if (message.type === "system") {
    messageDiv.innerHTML = `<em>${message.message}</em>`;
  } else if (message.type === "success") {
    messageDiv.innerHTML = `<em>${message.message}</em>`;
  }

  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
};

document.getElementById("messageForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const messageInput = document.getElementById("messageInput");
  ws.send(JSON.stringify({ type: "message", text: messageInput.value }));
  messageInput.value = "";
});

function displayAvailableRooms(rooms) {
  const availableRoomsDiv = document.getElementById("availableRooms");
  availableRoomsDiv.innerHTML = ""; // Clear previous room list

  if (rooms.length === 0) {
    availableRoomsDiv.innerHTML = "<p>No available rooms.</p>";
    return;
  }

  const roomList = document.createElement("ul"); // Create a list for the rooms

  rooms.forEach((room) => {
    const listItem = document.createElement("li");
    listItem.textContent = room; // Set the room name as the text
    roomList.appendChild(listItem); // Add the room to the list

    listItem.addEventListener("click", () => {
    ws.send(JSON.stringify({ type: 'join', username, room }));
    window.location.href = `/room?username=${username}&room=${room}`;
    console.log("Sending message:", message);
    });
  });

  availableRoomsDiv.appendChild(roomList); // Append the list to the available rooms div
}
