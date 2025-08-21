const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

const reservations = [];

app.post('/reserve', (req, res) => {
    // Log incoming data for debugging
    console.log('Received reservation:', req.body);

    const { name, email, checkin, checkout, roomtype } = req.body;

    // Check for missing fields
    if (!name || !email || !checkin || !checkout || !roomtype) {
        res.status(400).json({ message: 'Missing fields: All fields are required.' });
        return;
    }
    // Save reservation to memory
    reservations.push({ name, email, checkin, checkout, roomtype, time: new Date().toISOString() });
    res.status(200).json({ message: 'Reservation successful' });
});

// Simple admin endpoint (no authentication for demo)
app.get('/admin/reservations', (req, res) => {
    res.json(reservations);
});

app.listen(PORT, () => {
    console.log(`GHotel server running at http://localhost:${PORT}`);
});
