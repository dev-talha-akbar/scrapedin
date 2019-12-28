require("dotenv").config();

const { MONGODB_URI, LINKEDIN_EMAIL, LINKEDIN_PASSWORD } = process.env;

const scrapedin = require("./scrapedin/src/scrapedin");
const MongoClient = require("mongodb").MongoClient;

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

async function scrape() {
  console.info("Starting scraper");
  const scriptStart = process.hrtime();

  console.info("Connecting to DB");
  const db = await MongoClient.connect(MONGODB_URI);

  console.info("Logging into the configured LinkedIn account...");
  const Scraper = await scrapedin({
    email: LINKEDIN_EMAIL,
    password: LINKEDIN_PASSWORD,
    hasToGetContactInfo: true
  });

  console.info("Login complete. Fetching all connections...");
  const connections = (await Scraper.connectionScraper()).map(connection => {
    return {
      ...connection,
      username: connection.profile.split("/")[4]
    };
  });

  console.info("Connections fetched. Fetching profiles...");

  let allTags = [];

  try {
    let processed = 0;

    for (let i = 0; i < connections.length; i++) {
      if (processed % 50 === 0) {
        await new Promise((resolve, reject) => {
          setTimeout(resolve, 60000);
        });
      }

      if (processed % 25 === 0) {
        await new Promise((resolve, reject) => {
          setTimeout(resolve, 30000);
        });
      }

      if (processed % 10 === 0) {
        await new Promise((resolve, reject) => {
          setTimeout(resolve, 15000);
        });
      }

      if (processed % 5 === 0) {
        await new Promise((resolve, reject) => {
          setTimeout(resolve, 5000);
        });
      }

      const { name, profile: profileLink, username, avatar } = connections[i];

      const profilesCollection = db.collection("profiles");

      const dbProfile = await profilesCollection.findOne({ username });

      if (!dbProfile) {
        console.info(`Fetching profile for ${name} @ ${profileLink}`);
        const profile = await Scraper.profileScraper(profileLink);

        let tags = [];

        if (profile.positions.length > 0) {
          const { title, companyName, location } = profile.positions[0];

          tags = [title, companyName, location];
        }

        await profilesCollection.insertOne({
          ...profile,
          username,
          avatar,
          tags
        });

        allTags = [...allTags, ...tags];

        await new Promise((resolve, reject) => {
          setTimeout(resolve, 2500);
        });
      } else {
        console.info(
          `Skipping... profile for ${name} @ ${profileLink} already in DB`
        );
      }

      processed++;
    }

    console.info("Profiles fetched. Finishing...");
  } catch (e) {
    console.log(e);
  } finally {
    const tagsCollection = db.collection("tags");
    allTags = allTags.filter(onlyUnique).map(tagName => ({
      name: tagName
    }));

    await tagsCollection.insertMany(allTags);

    db.close();

    const scriptEnd = process.hrtime(scriptStart);
    console.info(
      "Execution time (hr): %ds %dms",
      scriptEnd[0],
      scriptEnd[1] / 1000000
    );
  }
}

scrape()
  .then(() => {
    console.log("Finished");
    process.exit();
  })
  .catch(err => {
    console.log(err);
  })
  .finally(() => {
    process.exit();
  });
