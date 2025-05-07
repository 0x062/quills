// quills_chat_bot.js
// Automation script for auto chatting on https://quills.fun/ using Ethereum wallet authentication, ethers.js, and axios

/**
 * Prerequisites:
 * - Node.js installed
 * - npm packages: ethers, axios, dotenv
 *
 * Setup:
 * 1. npm init -y
 * 2. npm install ethers axios dotenv
 * 3. Create a .env file with:
 *    RPC_URL=https://dream-rpc.somnia.network  // Somnia Testnet RPC (Chain ID: 50312)
 *    PRIVATE_KEY=<your wallet private key>
 *    CHAT_API_URL=https://quills.fun/api/chat
 *    MESSAGE_INTERVAL_MS=5000  // How often to send messages
 *    MESSAGE_TEXT="Hello from bot!"
 */

require('dotenv').config();
const { ethers } = require('ethers');
const axios = require('axios');

// Config
const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CHAT_API_URL = process.env.CHAT_API_URL;
const INTERVAL = parseInt(process.env.MESSAGE_INTERVAL_MS, 10) || 5000;
const MESSAGE_TEXT = process.env.MESSAGE_TEXT || 'Hello from bot!';

// Initialize provider and wallet
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

async function authenticate() {
  // Step 1: Get nonce from server
  const nonceRes = await axios.get(`${CHAT_API_URL}/nonce`, {
    params: { address: wallet.address }
  });
  const { nonce } = nonceRes.data;

  // Step 2: Sign nonce
  const signature = await wallet.signMessage(nonce);

  // Step 3: Send signature for auth token
  const authRes = await axios.post(`${CHAT_API_URL}/login`, {
    address: wallet.address,
    signature,
  });
  return authRes.data.token;  // JWT or similar
}

(async () => {
  console.log('Authenticating wallet:', wallet.address);
  let token;
  try {
    token = await authenticate();
    console.log('Authenticated! Token:', token.substring(0, 10) + '...');
  } catch (err) {
    console.error('Authentication failed:', err.response?.data || err.message);
    process.exit(1);
  }

  console.log(`Starting auto chat: sending "${MESSAGE_TEXT}" every ${INTERVAL}ms`);

  // Periodic message sender
  setInterval(async () => {
    try {
      const res = await axios.post(
        `${CHAT_API_URL}/send`,
        { message: MESSAGE_TEXT },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log(`Sent message at ${new Date().toLocaleTimeString()}:`, res.data.status);
    } catch (err) {
      console.error('Error sending message:', err.response?.data || err.message);
    }
  }, INTERVAL);
})();
