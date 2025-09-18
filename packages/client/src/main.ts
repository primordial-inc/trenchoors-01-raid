import { io } from 'socket.io-client';

// Connect to the server
const socket = io('http://localhost:3000');

// Get DOM elements
const counterElement = document.getElementById('counter') as HTMLSpanElement;
const buttonElement = document.getElementById('incrementBtn') as HTMLButtonElement;
const statusElement = document.getElementById('status') as HTMLDivElement;

// Check if elements exist
if (!counterElement || !buttonElement || !statusElement) {
  console.error('Required DOM elements not found!');
  console.error('counterElement:', counterElement);
  console.error('buttonElement:', buttonElement);
  console.error('statusElement:', statusElement);
  throw new Error('Required DOM elements are missing');
}

// Update counter display
function updateCounter(value: number) {
  counterElement.textContent = value.toString();
}

// Update connection status
function updateStatus(message: string, isConnected: boolean = true) {
  statusElement.textContent = message;
  statusElement.style.color = isConnected ? '#28a745' : '#dc3545';
}

// Socket event listeners
socket.on('connect', () => {
  console.log('Connected to server');
  updateStatus('Connected to server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
  updateStatus('Disconnected from server', false);
});

socket.on('counterUpdate', (newCounter: number) => {
  console.log('Counter updated:', newCounter);
  updateCounter(newCounter);
});

// Button click handler
buttonElement.addEventListener('click', () => {
  console.log('Button clicked, emitting buttonClick event');
  socket.emit('buttonClick');
});

// Initial setup
updateCounter(0);
updateStatus('Connecting...', false);
