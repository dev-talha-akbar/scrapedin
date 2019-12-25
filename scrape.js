require("dotenv").config();

const { MONGODB_URL, LINKEDIN_EMAIL, LINKEDIN_PASSWORD } = process.env;

const scrapedin = require("./scrapedin/src/scrapedin");
const MongoClient = require("mongodb").MongoClient;

async function scrape() {
  console.info("Starting scraper");
  const scriptStart = process.hrtime();

  console.info("Connecting to DB");
  const db = await MongoClient.connect(MONGODB_URL);

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

  for (let i = 0; i < connections.length; i++) {
    const { name, profile: profileLink, username } = connections[i];

    const profilesCollection = db.collection("profiles");

    const dbProfile = await profilesCollection.findOne({ username });

    if (!dbProfile) {
      console.info(`Fetching profile for ${name} @ ${profileLink}`);
      const profile = await Scraper.profileScraper(profileLink);
      await profilesCollection.insertOne({
        ...profile,
        username
      });
    } else {
      console.info(
        `Skipping... profile for ${name} @ ${profileLink} already in DB`
      );
    }
  }

  console.info("Profiles fetched. Finishing...");

  db.close();

  const scriptEnd = process.hrtime(scriptStart);
  console.info(
    "Execution time (hr): %ds %dms",
    scriptEnd[0],
    scriptEnd[1] / 1000000
  );
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
