require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const routes   = require('./routes');
const Driver   = require('./models/Driver');
const seedData = require('./data/seed');
const app  = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());
app.use('/api', routes);
app.get('/', (req, res) => res.json({ status: 'UrbanDash API running' }));
async function seedIfEmpty() {
  const count = await Driver.countDocuments();
  if (count === 0) {
    await Driver.insertMany(seedData);
    console.log('Seeded drivers into MongoDB');
  } else {
    console.log(`MongoDB already has ${count} drivers`);
  }
}
const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGO_URL;

if (!mongoURI) {
  console.error('FATAL ERROR: MONGO_URI is missing from environment variables.');
  process.exit(1);
}

mongoose
  .connect(mongoURI)
  .then(async () => {
    console.log('Connected to MongoDB');
    await seedIfEmpty();
    app.listen(PORT, () =>
      console.log(`UrbanDash API listening on http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });