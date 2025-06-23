// =====================
// server.js
// =====================
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

const DATA_FILE = path.join(__dirname, 'data.json');

let dataStore = [];
try {
  const rawData = fs.readFileSync(DATA_FILE);
  dataStore = JSON.parse(rawData);
} catch (err) {
  dataStore = [];
}

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(dataStore, null, 2));
}

app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/records', (req, res) => {
  res.json(dataStore);
});

app.post('/records', (req, res) => {
  const record = req.body;
  if (!record.nric) return res.status(400).json({ error: 'NRIC required' });

  if (dataStore.find(r => r.nric === record.nric)) {
    return res.status(409).json({ error: 'Record with this NRIC already exists' });
  }

  dataStore.push(record);
  saveData();
  res.status(201).json(record);
});

app.get('/records/:nric', (req, res) => {
  const record = dataStore.find(r => r.nric === req.params.nric);
  if (!record) return res.status(404).json({ error: 'Record not found' });
  res.json(record);
});

app.put('/records/:nric', (req, res) => {
  const index = dataStore.findIndex(r => r.nric === req.params.nric);
  if (index === -1) return res.status(404).json({ error: 'Record not found' });

  dataStore[index] = req.body;
  saveData();
  res.json(dataStore[index]);
});

app.get('/api/data/card/:cardNumber', (req, res) => {
  const record = dataStore.find(item => item.creditCardNumber === req.params.cardNumber);
  if (!record) return res.status(404).json({ error: 'Record not found' });
  res.json(record);
});

app.put('/api/data/card/:cardNumber/status', (req, res) => {
  const index = dataStore.findIndex(item => item.creditCardNumber === req.params.cardNumber);
  if (index === -1) return res.status(404).json({ error: 'Record not found' });

  const newStatus = req.body.status;
  if (!newStatus) return res.status(400).json({ error: 'Status field is required' });

  dataStore[index].status = newStatus;
  saveData();
  res.json({ success: true, updatedRecord: dataStore[index] });
});

// ✅ Get phone number by NRIC
app.get('/api/phone/:nric', (req, res) => {
  const record = dataStore.find(r => r.nric === req.params.nric);
  if (!record) return res.status(404).json({ error: 'Record not found' });
  res.json({ phone: record.phone || null });
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});