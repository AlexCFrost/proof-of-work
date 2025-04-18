const SHA256 = require('crypto-js/sha256');
const TARGET_DIFFICULTY = BigInt(0x0fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff);
const MAX_TRANSACTIONS = 10;
const BLOCK_REWARD = 50; // Mining reward

const mempool = [];
const blocks = [];

//  Initializing blockchain with genesis block
function initializeBlockchain() {
  const genesisBlock = {
    id: 0,
    timestamp: Date.now(),
    transactions: [],
    previousHash: "0".repeat(64),
    nonce: 0
  };
  
  // Mine the genesis block
  const { hash } = mineBlock(genesisBlock);
  blocks.push({ ...genesisBlock, hash });
}

// Creating a Merkle root from transactions
function createMerkleRoot(transactions) {
  if (transactions.length === 0) return SHA256("").toString();
  
  const transactionHashes = transactions.map(tx => SHA256(JSON.stringify(tx)).toString());
  
  return SHA256(transactionHashes.join('')).toString();
}

function addTransaction(transaction) {
  // Validate transaction
  if (!transaction || !transaction.fromAddress || !transaction.toAddress || !transaction.amount) {
    throw new Error("Invalid transaction");
  }
  mempool.push(transaction);
}

function mineBlock(block) {
  let hash;
  block.nonce = 0;
  block.merkleRoot = createMerkleRoot(block.transactions);
  
  console.log(`Mining block ${block.id}...`);
  
  while (true) {
    const blockString = JSON.stringify({
      id: block.id,
      timestamp: block.timestamp,
      merkleRoot: block.merkleRoot,
      previousHash: block.previousHash,
      nonce: block.nonce
    });
    
    hash = SHA256(blockString).toString();
    
    // Check if hash meets target difficulty 
    if (BigInt(`0x${hash}`) < TARGET_DIFFICULTY) {
      console.log(`Block mined with hash: ${hash} and nonce: ${block.nonce}`);
      break;
    }
    
    block.nonce++;
  }
  
  return { ...block, hash };
}

function mine() {
  // Create coinbase transaction (mining reward)
  const coinbaseTransaction = {
    fromAddress: "COINBASE",
    toAddress: "MINER_ADDRESS", // In real time this would be miner's address implementation
    amount: BLOCK_REWARD,
    timestamp: Date.now()
  };
  
  // Get transactions from mempool
  let transactions = [coinbaseTransaction]; 
  
  // Add up to MAX_TRANSACTIONS-1 from mempool 
  while (transactions.length < MAX_TRANSACTIONS && mempool.length > 0) {
    transactions.push(mempool.shift());
  }
  
  // Create the new block
  const previousBlock = blocks[blocks.length - 1];
  const newBlock = {
    id: blocks.length,
    timestamp: Date.now(),
    transactions: transactions,
    previousHash: previousBlock.hash,
    nonce: 0
  };
  
  // Mine the block and adding it to the chain
  const minedBlock = mineBlock(newBlock);
  blocks.push(minedBlock);
  
  return minedBlock;
}

function validateChain() {
  for (let i = 1; i < blocks.length; i++) {
    const currentBlock = blocks[i];
    const previousBlock = blocks[i - 1];
    
    // Validate hash reference
    if (currentBlock.previousHash !== previousBlock.hash) {
      return false;
    }
    
    // Validate block hash
    const blockData = {
      id: currentBlock.id,
      timestamp: currentBlock.timestamp,
      merkleRoot: currentBlock.merkleRoot,
      previousHash: currentBlock.previousHash,
      nonce: currentBlock.nonce
    };
    
    const hash = SHA256(JSON.stringify(blockData)).toString();
    
    if (hash !== currentBlock.hash) {
      return false;
    }
    
    // Validated hash meets the target difficulty
    if (!(BigInt(`0x${hash}`) < TARGET_DIFFICULTY)) {
      return false;
    }
  }
  
  return true;
}

//  Initializing with genesis block
initializeBlockchain();

module.exports = {
  TARGET_DIFFICULTY,
  MAX_TRANSACTIONS,
  addTransaction,
  mine,
  blocks,
  mempool,
  validateChain
};