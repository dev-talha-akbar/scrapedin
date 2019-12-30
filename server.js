require("dotenv").config();

const { MONGODB_URI } = process.env;

const express = require("express");
const bodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;

const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", function() {
  res.sendFile("public/index.html");
});

app.post("/search", async (req, res) => {
  const db = await MongoClient.connect(MONGODB_URI);
  const profilesCollection = db.collection("profiles");
  const profiles = [];

  const { search_term, filter_tags } = req.body;

  const filter_tags_arr = filter_tags
    ? typeof filter_tags === "string"
      ? [filter_tags]
      : filter_tags
    : [];
  const filter_tags_regexp = filter_tags_arr.map(tag => new RegExp(tag, "i"));

  let searchFilter;

  if (search_term || filter_tags_regexp.length) {
    searchFilter = {};
  }

  if (search_term) {
    searchFilter = {
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
    contact: 1,
    tags: 1
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
  const dbProfiles = await profilesCollection.find(undefined, {
    username: 1,
    avatar: 1,
    "profile.name": 1,
    "profile.headline": 1,
    contact: 1,
    tags: 1
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
