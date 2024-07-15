const { TelegramClient, Api } = require('telegram');
const { StringSession } = require('telegram/sessions');
const { NewMessage } = require('telegram/events/NewMessage');
const fs = require('fs');

// Read config and session data
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

let sessionString;
try {
  sessionString = fs.readFileSync('session.data', 'utf8');
} catch (e) {
  console.log('No saved session found.');
  process.exit(1); // Exit if no session is found
}

const client = new TelegramClient(new StringSession(sessionString), Number(config.api_id), config.api_hash, {
  useWSS: true,
});

// Enable verbose logging
client.setLogLevel("debug"); // everything

// Event handler function
async function eventPrint(event) {
  const message = event.message;
  console.log(event)
  // Check if it's a private message (from user or bot)
  if (event.isPrivate) {
    // Print sender id
    console.log(message.senderId);

    // Read message
    if (message.text === "hello") {
      const sender = await message.getSender();
      console.log("sender is", sender);
      await client.sendMessage(sender, {
        message: `Hi, your ID is ${message.senderId}`
      });
    }
  }
}

// Add event handler for new messages
client.addEventHandler(eventPrint, new NewMessage({ incoming: true, outgoing: false }));

async function main() {
  try {
    await client.connect();
    console.log("Connected using saved session!");
    await client.getMe();

    // Keep the process alive
    process.stdin.resume();
  } catch (error) {
    console.error("Error connecting to Telegram:", error);
  }
}

main();
