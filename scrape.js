require("dotenv").config();

const {
  MONGODB_URI,
  LINKEDIN_EMAIL,
  LINKEDIN_PASSWORD,
  MAX_PROFILES_PER_SESSION
} = process.env;

const scrapedin = require("./scrapedin/src/scrapedin");
const MongoClient = require("mongodb").MongoClient;

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
  const profilesCollection = db.collection("profiles");
  const dbBasicConnections = await profilesCollection
    .find(
      {
        basic: true
      },
      {
        username: 1,
        avatar: 1,
        "profile.name": 1,
        "profile.headline": 1,
        contact: 1,
        tags: 1,
        basic: 1
      }
    )
    .limit(parseInt(MAX_PROFILES_PER_SESSION, 10));
  const connections = await dbBasicConnections.toArray();
  console.info("Connections fetched. Fetching profiles...");

  let processed = 0;
  try {
    for (let i = 0; i < connections.length; i++) {
      const {
        _id,
        avatar,
        tags,
        username,
        profile: { name }
      } = connections[i];

      const url = `https://www.linkedin.com/in/${username}`;

      console.info(`Fetching profile for ${name} @ ${url}`);
      const profile = await Scraper.profileScraper(
        url,
        45000 + Math.random() * 60000
      );

      console.log(profile);

      const profileData = {
        ...profile,
        tags,
        avatar,
        username,
        basic: false
      };

      profileData.profile.name = name;

      await profilesCollection.replaceOne(
        {
          _id
        },
        profileData
      );

      processed++;
    }

    console.info("Profiles fetched. Finishing...");
  } catch (e) {
    console.log(e);
  } finally {
    db.close();

    const scriptEnd = process.hrtime(scriptStart);
    console.log(`Processed: ${processed}`);
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
