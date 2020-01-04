require("dotenv").config();

const fs = require("fs");

const { MONGODB_URI } = process.env;

const MongoClient = require("mongodb").MongoClient;

MongoClient.connect(MONGODB_URI).then(db => {
  async function findScrapedProfiles() {
    const profilesCollection = db.collection("profiles");

    const profiles = await profilesCollection.find(
      {
        basic: false
      },
      {
        _id: 1,
        positions: 1
      }
    );

    const profilesArray = profiles.toArray();

    return profilesArray;
  }

  async function updateTags(profiles) {
    const profilesCollection = db.collection("profiles");

    for (let i = 0; i < profiles.length; i++) {
      const profile = profiles[i];

      if (profile.positions && profile.positions[0]) {
        await profilesCollection.update(
          {
            _id: profile._id
          },
          {
            $set: {
              tags: [profile.positions[0].title]
            }
          }
        );
      }
    }
  }

  findScrapedProfiles()
    .then(updateTags)
    .catch(err => {
      console.log(err);
    })
    .finally(() => {
      db.close();
      process.exit();
    });
});
