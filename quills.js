// quills_chat_bot.js
// Automation script for auto chatting on https://quills.fun/ using Somnia Testnet, ethers.js v6, and axios

/**
 * Prerequisites:
 * - Node.js installed
 * - npm packages: ethers@^6, axios, dotenv
 *
 * Setup:
 * 1. npm init -y
 * 2. npm install ethers@^6 axios dotenv
 * 3. Create a .env file with:
 *    RPC_URL=https://dream-rpc.somnia.network  // Somnia Testnet RPC
 *    PRIVATE_KEY=<your Somnia wallet private key>
 *    CHAT_API_URL=https://quills.fun/api/chat
 *    MESSAGE_INTERVAL_MS=5000  // How often to send messages
 *    MESSAGE_TEXT="Hello from Somnia bot!"
 */

require('dotenv').config();
const { JsonRpcProvider, Wallet } = require('ethers');
const axios = require('axios');

// Config from .env
const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CHAT_API_URL = process.env.CHAT_API_URL;
const INTERVAL = parseInt(process.env.MESSAGE_INTERVAL_MS, 10) || 5000;
const MESSAGE_TEXT = process.env.MESSAGE_TEXT || 'Hello from Somnia bot!';

// Initialize provider and wallet
const provider = new JsonRpcProvider(RPC_URL);
const wallet = new Wallet(PRIVATE_KEY, provider);

async function authenticate() {
  // 1) Request nonce
  const { data: { nonce } } = await axios.get(`${CHAT_API_URL}/nonce`, {
    params: { address: wallet.address }
  });

  // 2) Sign nonce
  const signature = await wallet.signMessage(nonce);

  // 3) Get auth token
  const { data: { token } } = await axios.post(`${CHAT_API_URL}/login`, {
    address: wallet.address,
    signature
  });
  return token;
}

(async () => {
  console.log('Authenticating wallet:', wallet.address);
  let token;
  try {
    token = await authenticate();
    console.log('Authenticated! Token starts with:', token.slice(0, 10));
  } catch (err) {
    console.error('Authentication failed:', err.response?.data || err.message);
    process.exit(1);
  }

  console.log(`Starting auto chat: "${MESSAGE_TEXT}" every ${INTERVAL}ms`);

  setInterval(async () => {
    try {
      const { data } = await axios.post(
        `${CHAT_API_URL}/send`,
        { message: MESSAGE_TEXT },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log(`Sent at ${new Date().toLocaleTimeString()}:`, data.status);
    } catch (err) {
      console.error('Error sending message:', err.response?.data || err.message);
    }
  }, INTERVAL);
})();
