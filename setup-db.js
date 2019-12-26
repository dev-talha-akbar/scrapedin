require("dotenv").config();

const { MONGODB_URI } = process.env;

const MongoClient = require("mongodb").MongoClient;

async function setup() {
  const db = await MongoClient.connect(MONGODB_URI);

  const profilesCollection = db.collection("profiles");

  try {
    await profilesCollection.drop();
  } catch (e) {
    if (e.code !== 26) {
      throw e;
    }
  }

  await profilesCollection.createIndex({ username: 1 }, { unique: true });

  await db.close();
}

setup()
  .then(() => {
    console.log("Finished");
  })
  .catch(err => {
    console.log(err);
  });
