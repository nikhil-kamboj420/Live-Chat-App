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
  const message = JSON.parse(event.data);

  if (message.type === "roomsList") {
    displayAvailableRooms(message.rooms); // Update UI with room list
    return;
  }

  const chatMessages = document.getElementById("chatMessages");

  if (message.type === "error") {
    alert(message.message);
    window.location.href = "/";
    return;
  }

  const messageDiv = document.createElement('div');

  // Function to format the timestamp  seconds
  const formatTimestamp = (timestamp) => {
    let date;

    // Parse timestamp as a number or string
    if (typeof timestamp === 'number') {
      date = new Date(timestamp * 1000); // Convert seconds to milliseconds
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        date = new Date(Date.parse(timestamp)); // Parse ISO string
      }
    }
    if (isNaN(date.getTime())) {
      console.error("Invalid timestamp:", timestamp);
      return timestamp; // Fallback to raw timestamp if invalid
    }

    // Manually format the timestamp
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const amPm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12; // Convert 0 to 12 in 12-hour format
    return `${formattedHours}:${minutes} ${amPm}`;
  };

  // Handle different message types
  if (message.type === 'chat') {
    const timestamp = formatTimestamp(message.timestamp); // Format the timestamp
    if (message.username === username) {
      messageDiv.innerHTML = `${message.message} <strong style='color:black'>You</strong> <em style="font-size: .8rem; color: black">${timestamp}</em>`;
      messageDiv.style.textAlign = 'right';
      messageDiv.style.color = 'green';
      messageDiv.style.margin = '.5rem';

    
    } else {
      messageDiv.innerHTML = `<em style="font-size: .8rem; color: black">${timestamp}</em>  <strong style='color:black'>${message.username}</strong>: ${message.message}`;
      messageDiv.style.textAlign = 'left';
      messageDiv.style.color = 'blue';
      messageDiv.style.margin = '.5rem';
    }
  } else if (message.type === 'system' || message.type === 'success') {
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

  // Append the message to the chat and scroll to the bottom
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



// emojis into the input.

const emojiButton = document.getElementById("emojiButton");
const messageInput = document.getElementById("messageInput");
const emojiPickerContainer = document.getElementById("emojiPicker");

// Create an instance of the emoji picker
const { Picker } = window.EmojiMart;
const emojiPicker = new Picker({
  onEmojiSelect: (emoji) => {
    const currentValue = messageInput.value;
    const cursorPosition = messageInput.selectionStart;
    messageInput.value = currentValue.slice(0, cursorPosition) + emoji.native + currentValue.slice(cursorPosition);
    emojiPickerContainer.style.display = "none"; // Hide the emoji picker after selection
  },
});

// Append the emoji picker to the container
emojiPickerContainer.appendChild(emojiPicker);

// Toggle emoji picker visibility
emojiButton.addEventListener("click", () => {
  emojiPickerContainer.style.display = emojiPickerContainer.style.display === "none" ? "block" : "none";
});

// Hide emoji picker when clicking outside
document.addEventListener("click", (event) => {
  if (!emojiButton.contains(event.target) && !emojiPickerContainer.contains(event.target)) {
    emojiPickerContainer.style.display = "none";
  }
});