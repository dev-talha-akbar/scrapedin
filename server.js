require("dotenv").config({ path: __dirname + "/.env" });

const { MONGODB_URI } = process.env;

const express = require("express");
const bodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;

const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/public/index.html");
});

app.post("/search", async (req, res) => {
  const db = await MongoClient.connect(MONGODB_URI);
  const profilesCollection = db.collection("profiles");
  const profiles = [];

  let { search_term, filter_tags } = req.body;

  const filter_tags_arr = filter_tags
    ? typeof filter_tags === "string"
      ? [filter_tags]
      : filter_tags
    : [];
  const filter_tags_regexp = filter_tags_arr.map(tag => new RegExp(tag, "i"));
  const search_term_parts = search_term.split("@");
  const search_scraped = search_term_parts.reverse()[0] === "scraped";

  if (search_scraped) {
    search_term = search_term.replace(/@scraped$/, "");
  }

  let searchFilter;

  if (search_term || filter_tags_regexp.length) {
    searchFilter = {};
  }

  if (search_scraped) {
    searchFilter = {
      ...searchFilter,
      basic: false
    };
  }

  if (search_term) {
    searchFilter = {
      ...searchFilter,
      $or: [
        { "profile.name": new RegExp(search_term, "i") },
        { "profile.headline": new RegExp(search_term, "i") },
        { "profile.summary": new RegExp(search_term, "i") },
        {
          contact: {
            $elemMatch: {
              values: {
                $elemMatch: {
                  $regex: search_term,
                  $options: "i"
                }
              }
            }
          }
        },
        { location: new RegExp(search_term, "i") },
        { username: new RegExp(search_term, "i") }
      ]
    };
  }

  if (filter_tags_regexp.length) {
    searchFilter = {
      ...searchFilter,
      tags: {
        $in: filter_tags_regexp
      }
    };
  }

  const dbProfiles = await profilesCollection.find(searchFilter, {
    username: 1,
    avatar: 1,
    "profile.name": 1,
    "profile.headline": 1,
    "profile.location": 1,
    contact: 1,
    tags: 1,
    basic: 1
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

app.post("/profile/:username/tags", async (req, res) => {
  const db = await MongoClient.connect(MONGODB_URI);
  const profilesCollection = db.collection("profiles");
  const { username } = req.params;
  const { tags: _tags } = req.body;

  const tags = _tags ? (typeof _tags === "string" ? [_tags] : _tags) : [];

  await profilesCollection.update(
    {
      username
    },
    {
      $set: {
        tags
      }
    }
  );

  res.json({
    success: true
  });
});

app.get("/profiles", async (req, res) => {
  const db = await MongoClient.connect(MONGODB_URI);
  const profilesCollection = db.collection("profiles");
  const profiles = [];
  const dbProfiles = await profilesCollection
    .find(undefined, {
      username: 1,
      avatar: 1,
      "profile.name": 1,
      "profile.headline": 1,
      "profile.location": 1,
      contact: 1,
      tags: 1,
      basic: 1
    })
    .limit(100);

  dbProfiles.each((err, item) => {
    if (item === null) {
      db.close();
      res.json(profiles);
      return;
    }

    profiles.push(item);
  });
});

app.get("/scraped-profiles-count", async (req, res) => {
  const db = await MongoClient.connect(MONGODB_URI);
  const profilesCollection = db.collection("profiles");
  const count = await profilesCollection.count({
    basic: false
  });

  res.json(count);
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
