#!/bin/bash

# Navigate to the project root directory
cd /home/b1s/Documents/decentralCloud

# Function to check if a port is in use
port_in_use() {
  lsof -i :$1 >/dev/null
}

# Start Hardhat Node
if port_in_use 8545; then
  echo "Hardhat node (port 8545) is already running."
else
  echo "Starting Ganache node..."
  nohup ganache --chain.chainId 31337 --db /home/b1s/Documents/decentralCloud/ganache_db > ganache.log 2>&1 &
  sleep 5 # Give Ganache time to start
  (cd decentral-cloud/smart-contract && nohup npx hardhat run scripts/deploy.js --network localhost > deploy.log 2>&1) &
fi

# Start Backend Server
if port_in_use 3001; then
  echo "Backend server (port 3001) is already running."
else
  echo "Starting backend server..."
  nohup node decentral-cloud/backend/index.js > decentral-cloud/backend/backend.log 2>&1 &
fi

# Start Storage Node 1
if port_in_use 3002; then
  echo "Storage Node 1 (port 3002) is already running."
else
  echo "Starting storage node 1..."
  nohup node decentral-cloud/storage-node-1/index.js > decentral-cloud/storage-node-1/node1.log 2>&1 &
fi

# Start Storage Node 2
if port_in_use 3003; then
  echo "Storage Node 2 (port 3003) is already running."
else
  echo "Starting storage node 2..."
  nohup node decentral-cloud/storage-node-2/index.js > decentral-cloud/storage-node-2/node2.log 2>&1 &
fi

# Start Storage Node 3
if port_in_use 3004; then
  echo "Storage Node 3 (port 3004) is already running."
else
  echo "Starting storage node 3..."
  nohup node decentral-cloud/storage-node-3/index.js > decentral-cloud/storage-node-3/node3.log 2>&1 &
fi

# Start Frontend Server (React development server)
if port_in_use 3000; then
  echo "Frontend server (port 3000) is already running."
else
  echo "Starting frontend server..."
  REACT_APP_BACKEND_URL=http://192.168.50.203:3001 nohup npm start --prefix decentral-cloud/frontend > decentral-cloud/frontend/frontend.log 2>&1 &
fi

echo "All Decentral Cloud components checked."
