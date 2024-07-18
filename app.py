from telethon import TelegramClient, events, Button
from telethon.sessions import StringSession
import re
import json
import os
import asyncio
from telegram import Bot
from telegram.error import TelegramError

# Load config
with open('config.json') as f:
    config = json.load(f)

# Try to read the session string
session_file = 'session.data'
session_string = None
if os.path.exists(session_file):
    with open(session_file, 'r') as f:
        session_string = f.read().strip()

# Telegram client setup
client = TelegramClient(StringSession(session_string), config['api_id'], config['api_hash'])

# Telegram bot setup
bot_token = '6460326691:AAGhT2sw0fnszZKhKvnapHnZAvKz5Dl9uaY'
bot = Bot(token=bot_token)

sent_tokens = set()
click_counter = 0

@client.on(events.NewMessage())
async def handle_new_message(event):
    message = event.message
    channel_id = str(message.peer_id.channel_id) if hasattr(message.peer_id, 'channel_id') else None
    user_id = str(message.peer_id.user_id) if hasattr(message.peer_id, 'user_id') else None

    if channel_id == '1696523760':
        contract = await handle_message(message.text)
    elif user_id == '5970795027':  # BananaGun Bot
        if 'Max Spend per Wallet' in message.text:
            await message.reply('0.0001')
        elif 'Auto Snipe Tip' in message.text:
            await message.reply('0.0001')
        elif 'Status Pending' in message.text:
            global click_counter
            await asyncio.sleep(2)
            await message.click(text='🔴 MaxTx or Revert')
            click_counter += 1
            print(f"{click_counter} Contracts taken")
        elif any(phrase in message.text for phrase in ["Snipe Failed", "Deployer called a function/Token was interacted with", "Token has been purchased by another wallet", "Insufficient funds!"]):
            await asyncio.sleep(30 if "Snipe Failed" in message.text else 40 if "Deployer called" in message.text else 50 if "Token has been purchased" in message.text else 60)
            await message.click(text='× Close')

@client.on(events.MessageEdited())
async def handle_edited_message(event):
    message = event.message
    if not message or not message.text:
        return

    token_match = re.search(r'🍌 Token: (\w+)', message.text)
    contract_match = re.search(r'🍌 (0x[a-fA-F0-9]{40})', message.text)
    wallet_match = re.search(r'There are at least (\d+) wallets', message.text)

    if wallet_match:
        print(message.text)

    if token_match and wallet_match and contract_match:
        token = token_match.group(1)
        contract = contract_match.group(1)

        if token not in sent_tokens and 'Status Failed' not in message.text:
            try:
                await bot.send_message(
                    chat_id=-1001886387887,
                    text=f"{message.text}\n\nETH SCAN LINK:\nhttps://etherscan.io/address/{contract}"
                )
                await client.send_message('https://t.me/OttoSimBot', contract)
                sent_tokens.add(token)
            except TelegramError as e:
                print(f"Error sending message: {e}")

    if 'Status Failed' in message.text:
        await asyncio.sleep(35)
        await message.click(text='ⅹ Cancel')

    if 'Open in Sniper Bots:' in message.text:
        await bot.send_message(chat_id=-1001886387887, text=message.text)

async def send_message_to_bot(text):
    try:
        user = await client.get_input_entity('https://t.me/BananaGunSniper_bot')
        await client.send_message(user, text)
    except Exception as e:
        print(f"Error sending message: {e}")

def extract_contract_from_message(message_text):
    match = re.search(r'CA: (\S+)', message_text)
    return match.group(1) if match else None

async def handle_message(message_text):
    if "Deployed:" in message_text:
        contract = extract_contract_from_message(message_text)
        if contract:
            print(f"Contract found: {contract}")
            await send_message_to_bot(contract)
            return contract
        else:
            print("No contract found in the message.")

async def main():
    print("Starting...")
    
    try:
        await client.start()
        print("Client Connected")
        
        # If we've successfully connected and there was no session string before, save it
        if not session_string:
            with open('session.data', 'w') as f:
                f.write(client.session.save())
            print("Session saved!")
        
        # Run the client until disconnected
        await client.run_until_disconnected()
    except Exception as e:
        print(f"An error occurred: {e}")
        print("If this is your first time running the script, you may need to run it interactively to log in.")
        print("After successful login, the session will be saved for future use.")

if __name__ == '__main__':
    asyncio.run(main())
