const fs = require("fs");

const allProfiles = [];

for (let i = 0; i <= 12; i++) {
  console.log(`page${i}.json`);
  const rawJSON = fs.readFileSync(`page${i}.json`);
  const rawJSONObject = JSON.parse(rawJSON);

  for (let j = 0; j < rawJSONObject.data.paging.count; j++) {
    const profile = rawJSONObject.included[j];

    if (profile && profile.publicIdentifier) {
      allProfiles.push({
        profile: {
          name: `${profile.firstName} ${profile.lastName}`,
          headline: profile.occupation
        },
        tags: [],
        contact: [],
        username: profile.publicIdentifier,
        basic: true,
        avatar:
          profile.picture &&
          `${profile.picture.rootUrl}${profile.picture.artifacts[0].fileIdentifyingUrlPathSegment}`
      });
    }
  }
}

console.log(`allProfiles Count: ${allProfiles.length}`);

fs.writeFileSync("consolidated.json", JSON.stringify(allProfiles));
