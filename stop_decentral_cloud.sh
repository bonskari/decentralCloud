#!/bin/bash

# Function to kill a process listening on a given port
kill_process_on_port() {
  PORT=$1
  echo "Attempting to stop process on port $PORT..."
  PID=$(lsof -t -i :$PORT)
  if [ -n "$PID" ]; then
    kill -TERM $PID
    echo "Sent TERM signal to process $PID on port $PORT."
    # Wait a bit for the process to terminate
    sleep 2
    if kill -0 $PID 2>/dev/null; then
      echo "Process $PID on port $PORT did not terminate, sending KILL signal."
      kill -KILL $PID
    else
      echo "Process on port $PORT stopped successfully."
    fi
  else
    echo "No process found listening on port $PORT."
  fi
}

echo "Stopping Decentral Cloud components..."

# Stop Frontend Server (port 3000)
kill_process_on_port 3000

# Stop Backend Server (port 3001)
kill_process_on_port 3001

# Stop Storage Node 1 (port 3002)
kill_process_on_port 3002

# Stop Storage Node 2 (port 3003)
kill_process_on_port 3003

# Stop Storage Node 3 (port 3004)
kill_process_on_port 3004

# Stop Hardhat Node (port 8545)
kill_process_on_port 8545

# Stop Ganache Node (port 8545)
kill_process_on_port 8545

echo "Decentral Cloud components stop process complete."