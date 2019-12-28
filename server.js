require("dotenv").config();

const { MONGODB_URI } = process.env;

const express = require("express");
const bodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;

const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", function() {
  res.sendFile("public/index.html");
});

app.post("/search", async (req, res) => {
  const db = await MongoClient.connect(MONGODB_URI);
  const profilesCollection = db.collection("profiles");
  const profiles = [];

  const { search_term, filter_tags } = req.params;

  const dbProfiles = await profilesCollection.find(
    {
      "profile.name": {
        $regex: search_term
      }
    },
    {
      username: 1,
      avatar: 1,
      "profile.name": 1,
      "profile.headline": 1,
      contact: 1
    }
  );

  dbProfiles.each((err, item) => {
    if (item === null) {
      db.close();
      res.json(profiles);
      return;
    }

    profiles.push(item);
  });
});

app.get("/tags", async (req, res) => {
  const db = await MongoClient.connect(MONGODB_URI);
  const tagsCollection = db.collection("tags");
  const tags = [];
  const dbTags = await tagsCollection.find();

  dbTags.each((err, item) => {
    if (item === null) {
      db.close();
      res.json(tags);
      return;
    }

    tags.push(item);
  });
});

app.get("/profiles", async (req, res) => {
  const db = await MongoClient.connect(MONGODB_URI);
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
  const db = await MongoClient.connect(MONGODB_URI);
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
