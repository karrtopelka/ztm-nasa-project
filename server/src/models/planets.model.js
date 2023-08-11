const { parse } = require('csv-parse');
const fs = require('fs');
const { join } = require('path');

const planets = require('./planets.mongo');

const isHabitablePlanet = (planet) => {
  return (
    planet['koi_disposition'] === 'CONFIRMED' &&
    planet['koi_insol'] > 0.36 &&
    planet['koi_insol'] < 1.11 &&
    planet['koi_prad'] < 1.6
  );
};

const savePlanet = async (planet) => {
  try {
    await planets.updateOne(
      {
        keplerName: planet.kepler_name,
      },
      {
        keplerName: planet.kepler_name,
      },
      {
        upsert: true,
      },
    );
  } catch (err) {
    console.error(`Could not save planet ${err}`);
  }
};

const getAllPlanets = async () => {
  return await planets.find({}, { _id: 0, __v: 0 });
};

const loadPlanetsData = () => {
  return new Promise((resolve, reject) => {
    fs.createReadStream(join(__dirname, '..', '..', 'data', 'koi_table.csv'))
      .pipe(
        parse({
          delimiter: ',',
          columns: true,
          comment: '#',
        }),
      )
      .on('data', async (data) => {
        if (isHabitablePlanet(data)) {
          // habitablePlanets.push(data);
          savePlanet(data);
        }
      })
      .on('error', (err) => {
        console.log(err);
        reject(err);
      })
      .on('end', async () => {
        const foundPlanetsLength = (await getAllPlanets()).length;
        // console.log(habitablePlanets.map((planet) => planet['kepler_name']));
        console.log(`done, ${foundPlanetsLength} habitable planets found`);
        resolve();
      });
  });
};

module.exports = {
  getAllPlanets,
  loadPlanetsData,
};
