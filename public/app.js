const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('username');
const room = urlParams.get('room');

document.getElementById('roomName').innerText = `Room: ${room}`;

const ws = new WebSocket(`ws://${window.location.hostname}:5500`);
ws.onopen = () => {
  ws.send(
    JSON.stringify({
      type: 'join',
      username,
      room,
    })
  );
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  const chatMessages = document.getElementById('chatMessages');

  if (message.type === 'error') {
    alert(message.message);
    window.location.href = '/';
    return;
  }

  const messageDiv = document.createElement('div');
  if (message.type === 'chat') {
    messageDiv.innerHTML = `<strong>${message.username}</strong>: ${message.message} <small>${message.timestamp}</small>`;
  } else if (message.type === 'system') {
    messageDiv.innerHTML = `<em>${message.message}</em>`;
  } else if (message.type === 'success') {
    messageDiv.innerHTML = `<em>${message.message}</em>`;
  }

  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
};

document.getElementById('messageForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const messageInput = document.getElementById('messageInput');
  ws.send(JSON.stringify({ type: 'message', text: messageInput.value }));
  messageInput.value = '';
});
