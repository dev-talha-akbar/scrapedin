require("dotenv").config();

const { MONGODB_URL } = process.env;

const express = require("express");
const MongoClient = require("mongodb").MongoClient;

const app = express();

app.use(express.static("public"));

app.get("/", function() {
  res.sendFile("public/index.html");
});

app.get("/profiles", async (req, res) => {
  const db = await MongoClient.connect(MONGODB_URL);
  const profilesCollection = db.collection("profiles");
  const profiles = [];
  const dbProfiles = await profilesCollection.find(undefined, {
    username: 1,
    avatar: 1,
    "profile.name": 1,
    "profile.headline": 1,
    contact: 1
  });

  dbProfiles.each((err, item) => {
    if (item === null) {
      db.close();
      res.json(profiles);
      return;
    }

    profiles.push(item);
  });
});

app.get("/profile/:username", async (req, res) => {
  const db = await MongoClient.connect(MONGODB_URL);
  const { username } = req.params;

  const profilesCollection = db.collection("profiles");
  const profile = await profilesCollection.findOne({
    username
  });

  if (!profile) {
    res.status(404).json({
      message: "Not Found"
    });
  }

  res.json(profile);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`App listening on port ${PORT}`));
