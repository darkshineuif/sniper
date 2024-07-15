const { TelegramClient, Api} = require('telegram');
const { StringSession } = require('telegram/sessions');
const { NewMessage } = require('telegram/events');
const readline = require('readline');
const fs = require('fs')
const { EditedMessage } = require('telegram/events/EditedMessage');
const {Telegraf} = require('telegraf');
const bot = new Telegraf('6460326691:AAGhT2sw0fnszZKhKvnapHnZAvKz5Dl9uaY');
const sentTokens = new Set();



const config = require('./config.json');
let sessionString;
let clickCounter = 0;
// Input data
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});


try {
  sessionString = fs.readFileSync('session.data', 'utf8');
} catch (e) {
  // Handle error, like setting sessionString to null or logging the error
  console.log('No saved session found.');
}

const client = new TelegramClient(new StringSession(sessionString), Number(config.api_id), config.api_hash);
const editedMessageHandler = async (event) => {
  try {
    const message = event.message;
    if (!message || !message.message) return;  // Validate the message object
    

    const tokenMatch = message.message.match(/🍌 Token: (\w+)/);
    const contractMatch = message.message.match(/🍌 0x[a-fA-F0-9]{40}/);
    const walletMatch = message.message.match(/There are at least (\d+) wallets/);

    if(walletMatch){
      console.log(message.message);
    }

    if (tokenMatch && walletMatch) {
      const token = tokenMatch[1];
      const cleanedContract = contractMatch[0].replace("🍌 ", "");

      if (!sentTokens.has(token) && !message.message.includes('Status Failed')) {
        // Attempt to send the message
        try {
          await bot.telegram.sendMessage(-1001886387887, message.message + '\n' + '\nETH SCAN LINK:\n' + `https://etherscan.io/address/${cleanedContract}`);
          await client.invoke(
            new Api.messages.SendMessage({
              peer: 'https://t.me/OttoSimBot',
              message: cleanedContract
            })
          );
          sentTokens.add(token); // Only add the token if sendMessage was successful
        } catch (error) {
          console.error("Error sending message:", error);
        }
        // Add the token to the set only if message send was successful
      }
    }

    if (message.message.includes("Status Failed")) {
      // Your existing logic
      JSON.stringify(message.replyMarkup, null, 2)
      const buttonFilter = (button) => button.text === "ⅹ Cancel";
      setTimeout(async () => {
        await message.click({ filter: buttonFilter });
      }, 35000);
    }

    if (message.message.includes("Open in Sniper Bots:")){
      await bot.telegram.sendMessage(-1001886387887, message.message);
    }

  } catch (error) {
    console.error("An error occurred:", error);
  }
};

client.addEventHandler(editedMessageHandler, new EditedMessage({}));



const eventHandler = async (event) => {
  const { message } = event;
  const channelId = message?.peerId?.channelId?.toString();
  const userId = message?.peerId?.userId?.toString();
  let contract
  console.log(channelId)
  if (channelId === '1696523760') {
    contract = await handleMessage(message.message);
  } else if (userId === '5970795027') { // BananaGun Bot
    if (message.message.includes('Max Spend per Wallet')){
      await message.reply({ message: '0.0001' });
    } 
    if (message.message.includes('Auto Snipe Tip') ){
      await message.reply({ message: '0.0001' });
    } 
    if (message.message.includes("Status Pending") ){
      JSON.stringify(message.replyMarkup, null, 2)
      const buttonFilter = (button) => button.text === "🔴 MaxTx or Revert";
      setTimeout(async () => {
        await message.click({ filter: buttonFilter });
        clickCounter++;  // Increment the counter
        console.log(clickCounter + " Contracts taken");

      }, 2000);
    }
    if (message.message.includes("Snipe Failed")){
      JSON.stringify(message.replyMarkup, null, 2)
      const buttonFilter = (button) => button.text === "× Close";
      setTimeout(async () => {
        await message.click({ filter: buttonFilter });
      }, 30000);
    }
    if (message.message.includes("Deployer called a function/Token was interacted with")){
      JSON.stringify(message.replyMarkup, null, 2)
      const buttonFilter = (button) => button.text === "× Close";
      setTimeout(async () => {
        await message.click({ filter: buttonFilter });
      }, 40000);
    }
    if (message.message.includes("Token has been purchased by another wallet")){
      JSON.stringify(message.replyMarkup, null, 2)
      const buttonFilter = (button) => button.text === "× Close";
      setTimeout(async () => {
        await message.click({ filter: buttonFilter });
      }, 50000);
    }
    if (message.message.includes("Insufficient funds!")){
      JSON.stringify(message.replyMarkup, null, 2)
      const buttonFilter = (button) => button.text === "× Close";
      setTimeout(async () => {
        await message.click({ filter: buttonFilter });
      }, 60000);
    }
  }
}

client.addEventHandler(eventHandler, new NewMessage({}));

async function main() {
    try {
      if (!sessionString) {
        await client.start({
          phoneNumber: async () => {
            return new Promise((resolve) => {
              rl.question('Please enter your phone number: ', (input) => {
                resolve(input);
              });
            });
          },
          password: async () => {
            return new Promise((resolve) => {
              rl.question('Please enter your 2FA password: ', (input) => {
                resolve(input);
              });
            });
          },
          phoneCode: async () => {
            return new Promise((resolve) => {
              rl.question('Please enter the code you received: ', (input) => {
                resolve(input);
              });
            });
          },
          onError: (err) => {
            console.log(err);
          }
        });
        sessionString = client.session.save();
        fs.writeFileSync('session.data', sessionString);
        console.log("Session saved!");
        rl.close();  // Close the readline interface after authentication
      } else {
        await client.connect()
      }

      console.log("Connected!");
      //fetchChannelMessages();  // Fetch messages now

    } catch (error) {
      console.error("Error connecting to Telegram:", error);
    }
  }
  
/**
 * 
 *  send messages to the bot function
 * 
 */

async function sendMessageToBot(text) {
  try {
    const userId = 'https://t.me/BananaGunSniper_bot';  // Replace with the bot's user ID
    const message = text  // The message you want to send

    await client.invoke(
      new Api.messages.SendMessage({
        peer: userId,
        message: message
      })
    );
//    console.log(`Message sent to bot with ID ${userId}`);
  } catch (error) {
    console.error("Error sending message:", error);
  }
}

function extractContractFromMessage(messageText) {
  const contractRegex = /CA: (\S+)/;
  const match = messageText.match(contractRegex);
  
  if (match && match[1]) {
    return match[1];
  } else {
    return null;
  }
}

async function handleMessage(messageText) {
  if (messageText.includes("Deployed:")) {
    const contract = extractContractFromMessage(messageText);
    if (contract) {
      console.log(`Contract found: ${contract}`);
      await sendMessageToBot(contract)
      return contract
      // Do something with the contract
    } else {
      console.log("No contract found in the message.");
    }
  } else {
  //  console.log("The message does not contain 'New Token'.");
  }
}

main()

