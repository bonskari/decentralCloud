const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3003; // Port for storage-node-2

const fragmentsDir = path.join(__dirname, 'fragments');

// Ensure fragments directory exists
if (!fs.existsSync(fragmentsDir)) {
  fs.mkdirSync(fragmentsDir);
}

app.use(cors());
app.use(express.json({ limit: '50mb' })); // To parse JSON request bodies

// Endpoint to store a fragment
app.post('/store-fragment', (req, res) => {
  const { fragmentName, encryptedFragment } = req.body;
  if (!fragmentName || !encryptedFragment) {
    return res.status(400).send('Missing fragmentName or encryptedFragment.');
  }

  try {
    const fragmentPath = path.join(fragmentsDir, fragmentName);
    fs.writeFileSync(fragmentPath, Buffer.from(encryptedFragment, 'base64'));
    res.status(200).send('Fragment stored successfully.');
  } catch (error) {
    console.error('Error storing fragment:', error);
    res.status(500).send('Error storing fragment.');
  }
});

// Endpoint to retrieve a fragment
app.get('/retrieve-fragment/:fragmentName', (req, res) => {
  const { fragmentName } = req.params;
  const fragmentPath = path.join(fragmentsDir, fragmentName);

  if (!fs.existsSync(fragmentPath)) {
    return res.status(404).send('Fragment not found.');
  }

  try {
    const encryptedFragment = fs.readFileSync(fragmentPath);
    res.status(200).send(encryptedFragment.toString('base64'));
  } catch (error) {
    console.error('Error retrieving fragment:', error);
    res.status(500).send('Error retrieving fragment.');
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Storage Node 2 listening at http://localhost:${port}`);
});
