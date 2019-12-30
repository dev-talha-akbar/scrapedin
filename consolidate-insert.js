require("dotenv").config();

const fs = require("fs");

const consolidatedJSON = fs.readFileSync("consolidated.json");
const parsedConsolidatedJSON = JSON.parse(consolidatedJSON);

const { MONGODB_URI } = process.env;

const MongoClient = require("mongodb").MongoClient;

async function insertConsolidatedBasicProfiles() {
  const db = await MongoClient.connect(MONGODB_URI);

  const profilesCollection = db.collection("profiles");

  await profilesCollection.insertMany(parsedConsolidatedJSON);

  return "DONE";
}

insertConsolidatedBasicProfiles()
  .then(console.log)
  .catch(err => {
    console.log(err);
  })
  .finally(() => {
    process.exit();
  });
