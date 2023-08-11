const http = require('http');
require('dotenv').config();

const { mongoConnect } = require('./services/mongo');

const app = require('./app');

const { loadPlanetsData } = require('./models/planets.model');
const { loadLaunchData } = require('./models/launches.model');

const PORT = process.env.PORT || 8000;

const server = http.createServer(app);

const startServer = async () => {
  await mongoConnect();
  await loadPlanetsData();
  await loadLaunchData();

  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
};

startServer();