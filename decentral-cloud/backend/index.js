
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

const fragmentSize = 1024 * 1024; // 1MB fragment size

// Simple XOR encryption for demonstration purposes
const encrypt = (buffer, key) => {
  const encryptedBuffer = Buffer.alloc(buffer.length);
  for (let i = 0; i < buffer.length; i++) {
    encryptedBuffer[i] = buffer[i] ^ key.charCodeAt(i % key.length);
  }
  return encryptedBuffer;
};

// Simple XOR decryption for demonstration purposes
const decrypt = (buffer, key) => {
  const decryptedBuffer = Buffer.alloc(buffer.length);
  for (let i = 0; i < buffer.length; i++) {
    decryptedBuffer[i] = buffer[i] ^ key.charCodeAt(i % key.length);
  }
  return decryptedBuffer;
};
const app = express();
const port = 3001;

// Smart Contract ABI and Address
const contractAddress = require('../smart-contract/contract-address.json').contractAddress;
const contractABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_fileName",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_fileSize",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_uploadDate",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_fragmentHashes",
        "type": "string"
      }
    ],
    "name": "addFile",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "fileCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "files",
    "outputs": [
      {
        "internalType": "string",
        "name": "fileName",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "fileSize",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "uploadDate",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "fragmentHashes",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllFiles",
    "outputs": [
      {
        "internalType": "string[]",
        "name": "",
        "type": "string[]"
      },
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      },
      {
        "internalType": "string[]",
        "name": "",
        "type": "string[]"
      },
      {
        "internalType": "string[]",
        "name": "",
        "type": "string[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_index",
        "type": "uint256"
      }
    ],
    "name": "getFile",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Connect to the local Hardhat network
const provider = new ethers.JsonRpcProvider('http://localhost:8545');
const signer = new ethers.Wallet('0x964fe99db9c74dd2ee7f968884a8f216ca65152d39d0d1219526e2aea7c98321', provider);
const storageContract = new ethers.Contract(contractAddress, contractABI, signer);

app.use(cors());

// Simulated node storage directories
const nodeStorageUrls = [
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:3004',
];

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const upload = multer({ dest: uploadsDir });

app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  console.log('File received:', req.file.originalname);

  let originalFilePath; // Declare outside try block
  try {
    const fileSize = req.file.size;
    const uploadDate = new Date().toISOString();
    originalFilePath = req.file.path;
    const fileName = req.file.originalname;

    // Read the file
    const fileBuffer = fs.readFileSync(originalFilePath);

    // Fragment and encrypt the file, distributing across nodes
    const fragmentHashes = [];
    let fragmentCounter = 0;
    const replicationFactor = 2; // Each fragment will be stored on this many nodes

    for (let i = 0; i < fileBuffer.length; i += fragmentSize) {
      const fragment = fileBuffer.slice(i, i + fragmentSize);
      const encryptedFragment = encrypt(fragment, 'supersecretkey');
      const fragmentName = `${fileName}.part${fragmentCounter}.enc`;

      for (let r = 0; r < replicationFactor; r++) {
        const targetNodeIdx = (fragmentCounter + r) % nodeStorageUrls.length;
        const targetNodeUrl = nodeStorageUrls[targetNodeIdx];
        
        console.log(`Storing fragment ${fragmentName} on node ${targetNodeIdx} (${targetNodeUrl})`);

        const storeResponse = await fetch(`${targetNodeUrl}/store-fragment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fragmentName, encryptedFragment: encryptedFragment.toString('base64') }),
        });

        if (!storeResponse.ok) {
          throw new Error(`Failed to store fragment on node ${targetNodeIdx}: ${await storeResponse.text()}`);
        }
        fragmentHashes.push(`${targetNodeIdx}:${fragmentName}`); // Store node index and fragment name for each copy
      }
      fragmentCounter++; // Move to the next fragment
    }

    // Store file metadata and fragment info on the blockchain
    const tx = await storageContract.addFile(fileName, fileSize, uploadDate, fragmentHashes.join(','));
    await tx.wait();
    console.log('File metadata and fragment info stored on blockchain:', fileName, fileSize, uploadDate, fragmentHashes);
    res.send('File uploaded, fragmented, encrypted, and metadata stored successfully!');
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).send('Error processing file.');
  } finally {
    // Clean up the temporary uploaded file
    fs.unlinkSync(originalFilePath);
  }
});

app.get('/files', async (req, res) => {
  try {
    const [fileNames, fileSizes, uploadDates, fragmentHashes] = await storageContract.getAllFiles();
    const files = fileNames.map((fileName, index) => ({
      fileName,
      fileSize: Number(fileSizes[index]),
      uploadDate: uploadDates[index],
      fragmentHashes: fragmentHashes[index],
    }));
    res.json(files);
  } catch (error) {
    console.error('Error fetching files from blockchain:', error);
    res.status(500).send('Error fetching files.');
  }
});

app.get('/download/:fileName', async (req, res) => {
  const { fileName } = req.params;

  try {
    const [fileNames, fileSizes, uploadDates, allFragmentHashes] = await storageContract.getAllFiles();
    const fileIndex = fileNames.indexOf(fileName);

    if (fileIndex === -1) {
      return res.status(404).send('File not found.');
    }

    const fragmentInfo = allFragmentHashes[fileIndex].split(',');

    const fragmentInfoMap = new Map(); // Map fragmentName to a list of nodeIdx
    for (const info of fragmentInfo) {
      const parts = info.split(':');
      if (parts.length === 2) {
        const nodeIdx = parseInt(parts[0]);
        const fragmentName = parts[1];
        if (!fragmentInfoMap.has(fragmentName)) {
          fragmentInfoMap.set(fragmentName, []);
        }
        fragmentInfoMap.get(fragmentName).push(nodeIdx);
      } else {
        console.error(`Invalid fragment info format: ${info}`);
        return res.status(500).send('Error: Invalid fragment information.');
      }
    }

    let reassembledBuffer = Buffer.alloc(0);
    for (const [fragmentName, nodeIndices] of fragmentInfoMap.entries()) {
      let retrieved = false;
      for (const nodeIdx of nodeIndices) {
        console.log(`Attempting to retrieve fragment: ${fragmentName} from node index: ${nodeIdx}`);

        if (isNaN(nodeIdx) || nodeIdx < 0 || nodeIdx >= nodeStorageUrls.length) {
          console.error(`Invalid node index: ${nodeIdx}`);
          continue; // Try next replica
        }
        const targetNodeUrl = nodeStorageUrls[nodeIdx];

        try {
          const retrieveResponse = await fetch(`${targetNodeUrl}/retrieve-fragment/${fragmentName}`);
          if (!retrieveResponse.ok) {
            const errorBody = await retrieveResponse.text();
            console.error(`Failed to retrieve fragment from node ${targetNodeUrl}: ${retrieveResponse.status} - ${errorBody}`);
            continue; // Try next replica
          }
          const encryptedFragmentBase64 = await retrieveResponse.text();
          const encryptedFragment = Buffer.from(encryptedFragmentBase64, 'base64');
          const decryptedFragment = decrypt(encryptedFragment, 'supersecretkey');
          reassembledBuffer = Buffer.concat([reassembledBuffer, decryptedFragment]);
          retrieved = true;
          break; // Fragment retrieved, move to next fragment
        } catch (error) {
          console.error(`Error fetching fragment ${fragmentName} from node ${targetNodeUrl}:`, error);
          continue; // Try next replica
        }
      }
      if (!retrieved) {
        console.error(`Failed to retrieve fragment ${fragmentName} from any replica.`);
        return res.status(500).send(`Error: Failed to retrieve fragment ${fragmentName}.`);
      }
    }

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(reassembledBuffer);

  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).send('Error downloading file.');
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Backend listening at http://localhost:${port}`);
});
