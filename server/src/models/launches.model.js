const axios = require('axios');

const launches = require('./launches.mongo');
const planets = require('./planets.mongo');

const DEFAULT_FLIGHT_NUMBER = 100;
const SPACEX_API_URL = 'https://api.spacexdata.com/v5/launches/query';

const getLatestFlightNumber = async () => {
  const latestLaunch = await launches.findOne().sort('-flightNumber');

  if (!latestLaunch) {
    return DEFAULT_FLIGHT_NUMBER;
  }

  return latestLaunch.flightNumber;
};

const getAllLaunches = async (skip, limit) => {
  return await launches
    .find({}, { _id: 0, __v: 0 })
    .sort({ flightNumber: 1 })
    .skip(skip)
    .limit(limit);
};

const saveLaunch = async (launch) => {
  try {
    await launches.findOneAndUpdate(
      {
        flightNumber: launch.flightNumber,
      },
      launch,
      {
        upsert: true,
      },
    );

    return launch;
  } catch (err) {
    console.error(`Could not save launch ${err}`);
  }
};

const scheduleNewLaunch = async (launch) => {
  try {
    const planet = await planets.findOne({
      keplerName: launch.target,
    });

    if (!planet) {
      throw new Error('No matching planet was found');
    }

    const newFlightNumber = (await getLatestFlightNumber()) + 1;

    const newLaunch = Object.assign(launch, {
      success: true,
      upcoming: true,
      customers: ['NASA'],
      flightNumber: newFlightNumber,
    });

    return await saveLaunch(newLaunch);
  } catch (err) {
    console.error(err);
  }
};

const deleteLaunch = async (flightNumber) => {
  const abortedLaunch = await launches.findOneAndUpdate(
    { flightNumber },
    {
      upcoming: false,
      success: false,
    },
  );

  return abortedLaunch;
};

const findLaunch = async (filter) => {
  return await launches.findOne(filter);
};

const existsLaunchWithId = async (flightNumber) => {
  return await findLaunch({
    flightNumber,
  });
};

const populateLaunches = async () => {
  console.log('Downloading launch data...');

  const response = await axios.post(SPACEX_API_URL, {
    query: {},
    options: {
      pagination: false,
      populate: [
        {
          path: 'rocket',
          select: {
            name: 1,
          },
        },
        {
          path: 'payloads',
          select: {
            customers: 1,
          },
        },
      ],
    },
  });

  if (response.status !== 200) {
    console.log('Problem downloading launch data');
    throw new Error('Launch data download failed');
  }

  const launchDocs = response.data.docs;

  for (const launchDoc of launchDocs) {
    const payloads = launchDoc['payloads'];
    const customers = payloads.flatMap((payload) => {
      return payload['customers'];
    });

    const launchDate = new Date(launchDoc['date_local']);

    const newLaunch = {
      flightNumber: launchDoc['flight_number'],
      mission: launchDoc['name'],
      rocket: launchDoc['rocket']['name'],
      launchDate: launchDate,
      upcoming: launchDoc['upcoming'],
      success: launchDoc['success'],
      customers,
    };

    console.log(`${newLaunch.flightNumber} ${newLaunch.mission}`);
    await saveLaunch(newLaunch);
  }
};

const loadLaunchData = async () => {
  const firstLaunch = await findLaunch({
    flightNumber: 1,
    rocket: 'Falcon 1',
    mission: 'FalconSat',
  });

  if (firstLaunch) {
    console.log('Launch data already loaded!');
    return;
  }

  await populateLaunches();
};

module.exports = {
  getAllLaunches,
  scheduleNewLaunch,
  deleteLaunch,
  existsLaunchWithId,
  loadLaunchData,
};
