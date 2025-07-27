#!/bin/bash

# Define the path to your backup script
BACKUP_SCRIPT="/home/b1s/Documents/decentralCloud/backup_ganache_db_to_onedrive.sh"

# Define the backup interval in seconds (e.g., 86400 seconds = 24 hours)
BACKUP_INTERVAL=86400 # Daily backup

echo "Starting periodic Ganache DB backup service..."

while true; do
  echo "Running Ganache DB backup at $(date)"
  "$BACKUP_SCRIPT"
  echo "Backup complete. Sleeping for $BACKUP_INTERVAL seconds..."
  sleep $BACKUP_INTERVAL
done
