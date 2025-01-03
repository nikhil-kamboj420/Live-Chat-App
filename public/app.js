const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get("username");
const room = urlParams.get("room");

document.getElementById("roomName").innerText = `Room: ${room}`;

const ws = new WebSocket(`ws://${window.location.hostname}:5500`);

// Create an Audio object for notification sound
const notificationSound = new Audio('./notification.wav'); 

ws.onopen = () => {
  ws.send(JSON.stringify({ type: "join", username, room }));
  ws.send(JSON.stringify({ type: "getRooms" })); // Request available rooms
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  const chatMessages = document.getElementById("chatMessages");

  if (message.type === "roomsList") {
    displayAvailableRooms(message.rooms); // Update UI with room list
    return;
  }

  if (message.type === "error") {
    alert(message.message);
    window.location.href = "/";
    return;
  }

  const messageDiv = document.createElement("div");

  // Function to format the timestamp
  const formatTimestamp = (timestamp) => {
    let date;

    // Parse timestamp as a number or string
    if (typeof timestamp === "number") {
      date = new Date(timestamp * 1000); // Convert seconds to milliseconds
    } else if (typeof timestamp === "string") {
      date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        date = new Date(Date.parse(timestamp)); // Parse ISO string
      }
    }
    if (isNaN(date.getTime())) {
      return timestamp; // Fallback to raw timestamp if invalid
    }

    // Manually format the timestamp
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const amPm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12; // Convert 0 to 12 in 12-hour format
    return `${formattedHours}:${minutes} ${amPm}`;
  };

  // Handle different message types
  if (message.type === "chat") {
    // Play the notification sound for new chat messages
    notificationSound.play();

    const timestamp = formatTimestamp(message.timestamp); // Format the timestamp
    if (message.username === username) {
      messageDiv.innerHTML = `${message.message} <strong style='color:black'>You</strong> <em style="font-size: .8rem; color: black">${timestamp}</em>`;
      messageDiv.style.textAlign = "right";
      messageDiv.style.color = "#007bff";
      messageDiv.style.margin = ".5rem";
    } else {
      messageDiv.innerHTML = `<em style="font-size: .8rem; color: black">${timestamp}</em>  <strong style='color:black'>${message.username}</strong>: ${message.message}`;
      messageDiv.style.textAlign = "left";
      messageDiv.style.color = "#dc69ff";
      messageDiv.style.margin = ".5rem";
    }
  } else if (message.type === "system" || message.type === "success") {
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

  // Play the notification sound when sending a message
  notificationSound.play();

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
      listItem.style.cursor = "not-allowed"; // Change cursor to indicate it's not clickable
      listItem.title = "You are currently in this room"; // Add a tooltip for better UX
    } else {
      // If it is not the current room, add click event listener
      listItem.addEventListener("click", () => {
        ws.send(JSON.stringify({ type: "join", username, room }));
        window.location.href = `/room?username=${username}&room=${room}`;
      });
    }

    roomList.appendChild(listItem); // Add the room to the list
  });

  availableRoomsDiv.appendChild(roomList); // Append the list to the available rooms div
}

// textfromatting

// text formatting
const messageInput = document.getElementById("messageInput");
let textFormatting = document.querySelector(".text-formatting");
textFormatting.addEventListener("click", (e) => {
  if (e.target.innerText === "B") {
    messageInput.value = `<b>${messageInput.value}</b>`;
  } else if (e.target.innerText === "I") {
    messageInput.value = `<i>${messageInput.value}</i>`;
  } else if (e.target.innerText === "U") {
    messageInput.value = `<u>${messageInput.value}</u>`;
  } else if (e.target.innerText === "🔗") {
    messageInput.value = `<a href="${messageInput.value}" target="_blank">${messageInput.value}</a>`;
  }
});

// Add the emoji selection functionality

const emoji = document.getElementById("emoji");
emoji.addEventListener("click", () => {
  const emojiContainer = document.getElementById("emoji-container");
  emojiContainer.style.display = "block";
  emojiContainer.addEventListener("mouseout", () => {
    setTimeout(() => {
      emojiContainer.style.display = "none";
    }, 1000);
  });
  document
    .querySelector("emoji-picker")
    .addEventListener("emoji-click", (event) => {
      const emoji = event.detail.unicode; // Get the selected emoji
      const messageInput = document.getElementById("messageInput");
      messageInput.value += emoji; // Append the selected emoji to the input field
    });
});

// file sharing functionality

document.getElementById("file").addEventListener("click", function () {
  document.getElementById("fileInput").click();
});

document
  .getElementById("fileInput")
  .addEventListener("change", function (event) {
    const files = event.target.files;
    const chatMessages = document.getElementById("chatMessages");

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileURL = URL.createObjectURL(file);
      const messageElement = document.createElement("div");

      // Display the file based on its type
      if (file.type.startsWith("image/")) {
        messageElement.innerHTML = `<img src="${fileURL}" alt="${file.name}" style="max-width: 200px;">`;
      } else if (file.type.startsWith("video/")) {
        messageElement.innerHTML = `<video controls src="${fileURL}" style="max-width: 200px;"></video>`;
      } else if (file.type.startsWith("audio/")) {
        messageElement.innerHTML = `<audio controls src="${fileURL}"></audio>`;
      } else if (file.type === "application/pdf") {
        messageElement.innerHTML = `<a href="${fileURL}" target="_blank">PDF: ${file.name}</a>`;
      } else {
        messageElement.innerText = `File: ${file.name}`;
      }

      chatMessages.appendChild(messageElement);
    }

    // Clear the file input for the next selection
    event.target.value = "";
  });


  // creating new rooms
  const newRoomInput = document.getElementById('newRoomInput');
  const createRoomSpan = document.getElementById('createRoomSpan');
  const blurBackground = document.getElementById('blurBackground');
  
  // Function to show the new room input and apply the blur effect
  function showNewRoomInput() {
    newRoomInput.style.display = 'block'; // Show the input
  }
  
  // Function to hide the new room input and remove the blur effect
  function hideNewRoomInput() {
    newRoomInput.style.display = 'none'; // Hide the input
    blurBackground.classList.remove('blur'); // Remove the blur class from the background
  }
  
  // Add event listener for the span click
  createRoomSpan.addEventListener('click', () => {
    // Show the input when the span is clicked
    showNewRoomInput();
  });
  
  // Add event listener for input to apply blur
  newRoomInput.addEventListener("input", () => {
    blurBackground.classList.add("blur");
  });
  
  // Add event listener for keydown to check for Enter key
  newRoomInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      const roomName = newRoomInput.value.trim();
      
      if (roomName) {
        // Send a message to the server to create a new room
        ws.send(JSON.stringify({ type: 'createRoom', room: roomName }));
        window.location.reload();
        newRoomInput.value = '';
        
        // Hide the input and remove the blur effect
        hideNewRoomInput();
        window.location.reload(); // Reload the page if necessary
      } else {
        alert('Please enter a room name.');
      }
    }
  });

  createRoomSpan.addEventListener('click',()=>{
    newRoomInput.style.display='inline-block';
    blurBackground.classList.add("blur");
});
  if(window.innerWidth<480){
    const availableRoomsDiv = document.getElementById("availableRooms");
    availableRoomsDiv.classList.add("smallDeviceStyle")
    const roomWrapper = document.querySelector(".room_wrapper");
    let roomBar = document.createElement('span');
    roomBar.textContent = "→";
    roomWrapper.prepend(roomBar);
    roomBar.addEventListener('click',()=>{
      availableRoomsDiv.style.display='block';
    })
  }

    else if(window.innerWidth>480 && window.innerWidth<768){
    const availableRoomsDiv = document.getElementById("availableRooms");
    availableRoomsDiv.classList.add("smallDeviceStyle")
    const roomWrapper = document.querySelector(".room_wrapper");
    let roomBar = document.createElement('span');
    roomBar.textContent = "→";
    roomWrapper.prepend(roomBar);
    roomBar.addEventListener('click',()=>{
      availableRoomsDiv.style.display='block';
    })
  }