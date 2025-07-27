#!/bin/bash

# Define the path to your OneDrive sync folder
ONEDRIVE_PATH="/mnt/usb-WD_Elements/onedrive"

# Define the path to your Ganache DB
GANACHE_DB_PATH="/home/b1s/Documents/decentralCloud/ganache_db"

# Create a timestamp for the backup directory
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DEST="${ONEDRIVE_PATH}/pop_backups/ganache_db_backup"

echo "Starting Ganache DB backup to OneDrive..."

# Stop all Decentral Cloud components (including Ganache) to ensure data consistency
/home/b1s/Documents/decentralCloud/stop_decentral_cloud.sh

# Create the backup destination directory
mkdir -p "$BACKUP_DEST"

# Copy the Ganache DB to the backup destination
cp -r "$GANACHE_DB_PATH" "$BACKUP_DEST"

if [ $? -eq 0 ]; then
  echo "Successfully backed up Ganache DB to: $BACKUP_DEST"
else
  echo "Error: Failed to back up Ganache DB to OneDrive."
fi

# Restart all Decentral Cloud components
/home/b1s/Documents/decentralCloud/start_decentral_cloud.sh

echo "Ganache DB backup process complete."
