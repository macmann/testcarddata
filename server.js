// =====================
// server.js
// =====================
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const app = express();
// Use the PORT environment variable if available (e.g. on Render)
const port = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, 'data.json');
const LOG_FILE = path.join(__dirname, 'logs.json');
const TICKET_FILE = path.join(__dirname, 'tickets.json');

let dataStore = [];
try {
  const rawData = fs.readFileSync(DATA_FILE);
  dataStore = JSON.parse(rawData);
} catch (err) {
  dataStore = [];
}

let apiLogs = [];
try {
  apiLogs = JSON.parse(fs.readFileSync(LOG_FILE));
} catch (err) {
  apiLogs = [];
}

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(dataStore, null, 2));
}

function saveLogs() {
  fs.writeFileSync(LOG_FILE, JSON.stringify(apiLogs, null, 2));
}

let ticketStore = [];
try {
  ticketStore = JSON.parse(fs.readFileSync(TICKET_FILE));
} catch (err) {
  ticketStore = [];
}

function saveTickets() {
  fs.writeFileSync(TICKET_FILE, JSON.stringify(ticketStore, null, 2));
}

const VALID_TICKET_STATUSES = ['New', 'In Progress', 'Resolved'];

app.use(bodyParser.json());
app.use(express.static('public'));

// Log API requests
app.use((req, res, next) => {
  const entry = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl
  };
  apiLogs.push(entry);
  saveLogs();
  console.log(`[${entry.timestamp}] ${entry.method} ${entry.url}`);
  next();
});

app.get('/records', (req, res) => {
  res.json(dataStore);
});

app.post('/records', (req, res) => {
  const record = req.body;
  if (!record.nric || !record.username || !record.userid) {
    return res.status(400).json({ error: 'NRIC, username, and userid required' });
  }

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

  const updatedRecord = { ...dataStore[index], ...req.body, nric: req.params.nric };
  if (!updatedRecord.username || !updatedRecord.userid) {
    return res.status(400).json({ error: 'username and userid required' });
  }

  dataStore[index] = updatedRecord;
  saveData();
  res.json(updatedRecord);
});

app.get('/api/data/card/:cardNumber', (req, res) => {
  const record = dataStore.find(item => item.creditCardNumber === req.params.cardNumber);
  if (!record) return res.status(404).json({ error: 'Record not found' });
  res.json(record);
});

app.put('/api/data/card/:cardNumber', (req, res) => {
  const index = dataStore.findIndex(item => item.creditCardNumber === req.params.cardNumber);
  if (index === -1) return res.status(404).json({ error: 'Record not found' });

  const updatedRecord = {
    ...dataStore[index],
    ...req.body,
    creditCardNumber: req.params.cardNumber
  };
  if (!updatedRecord.username || !updatedRecord.userid) {
    return res.status(400).json({ error: 'username and userid required' });
  }
  dataStore[index] = updatedRecord;
  saveData();
  res.json(updatedRecord);
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

// Ticketing APIs
app.get('/api/tickets', (req, res) => {
  res.json(ticketStore);
});

app.post('/api/tickets', (req, res) => {
  const { description } = req.body;
  if (!description) return res.status(400).json({ error: 'Description required' });
  const ticket = {
    id: Date.now().toString(),
    description,
    status: 'New'
  };
  ticketStore.push(ticket);
  saveTickets();
  res.status(201).json({ id: ticket.id });
});

app.get('/api/tickets/:id', (req, res) => {
  const ticket = ticketStore.find(t => t.id === req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  res.json(ticket);
});

app.put('/api/tickets/:id/status', (req, res) => {
  const ticket = ticketStore.find(t => t.id === req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  const { status } = req.body;
  if (!VALID_TICKET_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  ticket.status = status;
  saveTickets();
  res.json({ success: true, ticket });
});

// ✅ Get phone number by NRIC
app.get('/api/phone/:nric', (req, res) => {
  const record = dataStore.find(r => r.nric === req.params.nric);
  if (!record) return res.status(404).json({ error: 'Record not found' });
  res.json({ phone: record.phone || null });
});

app.get('/api/logs', (req, res) => {
  const { from, to, method } = req.query;
  let filtered = apiLogs;

  if (from) {
    const fromDate = new Date(from);
    filtered = filtered.filter(log => new Date(log.timestamp) >= fromDate);
  }
  if (to) {
    const toDate = new Date(to);
    filtered = filtered.filter(log => new Date(log.timestamp) <= toDate);
  }
  if (method) {
    filtered = filtered.filter(log => log.method === method.toUpperCase());
  }
  res.json(filtered);
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
