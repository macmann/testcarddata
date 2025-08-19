const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
// Use the PORT environment variable if provided (e.g. Render)
const port = process.env.PORT || 3000;

const dataFile = path.join(__dirname, 'data.json');

// Ensure data.json file exists, initialize with empty array if not
if (!fs.existsSync(dataFile)) {
  fs.writeFileSync(dataFile, '[]', 'utf-8');
}

app.use(express.json());
app.use(express.static('public')); // Serve frontend files from 'public' folder

// Log API requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// GET all records
app.get('/api/data', (req, res) => {
  fs.readFile(dataFile, 'utf-8', (err, data) => {
    if (err) {
      console.error('Error reading data file:', err);
      return res.status(500).send('Error reading data');
    }
    try {
      const json = JSON.parse(data);
      res.json(json);
    } catch (parseErr) {
      console.error('Error parsing data file:', parseErr);
      res.status(500).send('Error parsing data');
    }
  });
});

// POST new record
app.post('/api/data', (req, res) => {
  const newEntry = req.body;

  // Basic validation: require 'nric', 'username', and 'userid' fields
  if (!newEntry.nric || !newEntry.username || !newEntry.userid) {
    return res.status(400).json({ error: 'NRIC, username, and userid are required' });
  }

  fs.readFile(dataFile, 'utf-8', (err, data) => {
    if (err) {
      console.error('Error reading data file:', err);
      return res.status(500).send('Error reading data');
    }

    let json;
    try {
      json = JSON.parse(data);
    } catch (parseErr) {
      console.error('Error parsing data file:', parseErr);
      return res.status(500).send('Error parsing data');
    }

    json.push(newEntry);

    fs.writeFile(dataFile, JSON.stringify(json, null, 2), (writeErr) => {
      if (writeErr) {
        console.error('Error writing data file:', writeErr);
        return res.status(500).send('Error writing data');
      }
      res.json({ success: true });
    });
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
