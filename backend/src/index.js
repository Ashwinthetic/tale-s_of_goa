const express = require('express');
const cors = require('cors');
require('dotenv').config();

const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'Tales of Goa Backend API',
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`[Backend Server] Running on port ${PORT}`);
});
