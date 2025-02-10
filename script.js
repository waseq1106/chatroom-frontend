const socket = io();
const loginContainer = document.getElementById('login-container');
const chatContainer = document.getElementById('chat-container');
const idInput = document.getElementById('id-input');
const loginButton = document.getElementById('login-button');
const messages = document.getElementById('messages');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');

let userName = '';
let lastSender = null; // Tracks the last sender for consecutive messages
let reactions = {}; // Store reactions with emoji and counts
let activeReactionBar = null; // Track the currently active reaction bar

// Handle login
loginButton.addEventListener('click', () => {
  const userId = idInput.value.trim();
  if (userId) {
    socket.emit('login', userId, (response) => {
      if (response.success) {
        userName = response.name;
        loginContainer.style.display = 'none';
        chatContainer.style.display = 'block';
        document.getElementById('chatroom-welcome').style.display = 'block';
      } else {
        alert(response.message);
      }
    });
  } else {
    alert('Please enter your ID to join the chat!');
  }
});



// Handle message submission
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const message = messageInput.value.trim();
  if (message) {
    socket.emit('chat message', { name: userName, message });
    messageInput.value = '';
  }
});

// Handle incoming chat messages
socket.on('chat message', (data) => {
  const item = document.createElement('li');
  const messageContainer = document.createElement('div');
  messageContainer.classList.add('message-container');
  messageContainer.dataset.messageId = data.messageId;

  if (data.name === userName) {
    item.classList.add('my-message');
    messageContainer.classList.add('my-message');
  } else {
    item.classList.add('other-message');
    messageContainer.classList.add('other-message');
  }

  if (lastSender !== data.name) {
    const nameElem = document.createElement('div');
    nameElem.classList.add('name');
    nameElem.textContent = data.name;
    messageContainer.appendChild(nameElem);
  } else {
    messageContainer.style.marginTop = '-20px';
  }

  lastSender = data.name;

  const textElem = document.createElement('div');
  textElem.classList.add('text');
  textElem.textContent = data.message;

  messageContainer.appendChild(textElem);

  const reactionButtons = document.createElement('div');
  reactionButtons.classList.add('reaction-buttons');
  reactionButtons.innerHTML = `
    <span class="reaction-button">🤍</span>
    <span class="reaction-button">😭</span>
    <span class="reaction-button">🙂</span>
    <span class="reaction-button">😡</span>
  `;

  messageContainer.appendChild(reactionButtons);

  textElem.addEventListener('click', () => {
    if (activeReactionBar && activeReactionBar !== reactionButtons) {
      // Hide the currently active reaction bar
      activeReactionBar.style.display = 'none';
    }

    if (reactionButtons.style.display === 'flex') {
      reactionButtons.style.display = 'none';
      activeReactionBar = null; // No active reaction bar
    } else {
      reactionButtons.style.display = 'flex';
      activeReactionBar = reactionButtons; // Set this as the active reaction bar
    }
  });

  const handleReaction = (emoji) => {
    reactionButtons.style.display = 'none';
    activeReactionBar = null; // Reset the active reaction bar

    socket.emit('emoji reaction', { messageId: data.messageId, emoji });
  };

  reactionButtons.querySelectorAll('.reaction-button').forEach((button) => {
    button.addEventListener('click', () => handleReaction(button.textContent));
  });

  item.appendChild(messageContainer);
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
});

// Handle reactions broadcasted by the server
socket.on('emoji reaction', (data) => {
  if (!reactions[data.messageId]) {
    reactions[data.messageId] = {};
  }
  if (!reactions[data.messageId][data.emoji]) {
    reactions[data.messageId][data.emoji] = 1;
  } else {
    reactions[data.messageId][data.emoji]++;
  }

  const messageContainers = document.querySelectorAll('.message-container');
  messageContainers.forEach((container) => {
    if (container.dataset.messageId === data.messageId) {
      updateReactions(container, data.messageId);
    }
  });
});

// Update reactions display
function updateReactions(messageContainer, messageId) {
  const existingReactions = messageContainer.querySelector('.reactions');
  if (existingReactions) {
    existingReactions.remove();
  }

  const reactionsContainer = document.createElement('div');
  reactionsContainer.classList.add('reactions');

  const emojiCounts = reactions[messageId] || {};
  for (const emoji in emojiCounts) {
    const count = emojiCounts[emoji];
    const emojiSpan = document.createElement('span');
    emojiSpan.textContent = count > 1 ? `${emoji} ${count}` : `${emoji}`;
    reactionsContainer.appendChild(emojiSpan);
  }

  messageContainer.appendChild(reactionsContainer);
}
