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
  const connections = await Scraper.connectionScraper();

  const connectionsCollection = db.collection("connections");
  await connectionsCollection.insertMany(connections);

  console.info("Connections fetched. Fetching profiles...");

  for (let i = 0; i < 5; i++) {
    const { name, profile: profileLink } = connections[i];
    console.info(`Fetching profile for ${name} @ ${profileLink}`);

    const profile = await Scraper.profileScraper(profileLink);

    const profilesCollection = db.collection("profiles");

    await profilesCollection.insertOne(profile);
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
