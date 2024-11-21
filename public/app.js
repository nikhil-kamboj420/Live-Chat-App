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

  const messageDiv = document.createElement('div');

  if (message.type === 'chat') {
    // Check if the message is from the current user
    if (message.username === username) {
      messageDiv.innerHTML = `<strong>You</strong>: ${message.message} <small>${message.timestamp}</small>`;
    } else {
      messageDiv.innerHTML = `<strong>${message.username}</strong>: ${message.message} <small>${message.timestamp}</small>`;
    }
  } else if (message.type === 'system') {
    messageDiv.innerHTML = `<em>${message.message}</em>`;
    messageDiv.style.display = "block";
    messageDiv.style.opacity = 1;
    setTimeout(() => {
      messageDiv.style.transition = "opacity 0.5s";
      messageDiv.style.opacity = 0;
      setTimeout(() => {
        messageDiv.style.display = "none";
      }, 500);
    }, 3000); 
  } else if (message.type === 'success') {
    messageDiv.innerHTML = `<em>${message.message}</em>`;
    messageDiv.style.display = "block";
    messageDiv.style.opacity = 1;
    setTimeout(() => {
      messageDiv.style.transition = "opacity 0.5s";
      messageDiv.style.opacity = 0;
      setTimeout(() => {
        messageDiv.style.display = "none";
      }, 500);
    }, 3000);
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

    // Check if the room is the current room
    if (room === urlParams.get("room")) { 
      // If it is the current room, disable the click event
      listItem.style.cursor = 'not-allowed'; // Change cursor to indicate it's not clickable
      listItem.title = "You are currently in this room"; // Add a tooltip for better UX
    } else {
      // If it is not the current room, add click event listener
      listItem.addEventListener("click", () => {
        ws.send(JSON.stringify({ type: 'join', username, room }));
        window.location.href = `/room?username=${username}&room=${room}`;
      });
    }

    roomList.appendChild(listItem); // Add the room to the list
  });

  availableRoomsDiv.appendChild(roomList); // Append the list to the available rooms div
}