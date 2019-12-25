const openPage = require("../openPage");
const scrapSection = require("../scrapSection");
const scrollToPageBottom = require("./scrollToPageBottom");
const seeMoreButtons = require("./seeMoreButtons");

const logger = require("../logger");

module.exports = async (browser, cookies, waitTimeToScrapMs = 500) => {
  logger.info("connections", `starting scraping`);

  const page = await openPage(
    browser,
    cookies,
    "https://www.linkedin.com/mynetwork/invite-connect/connections/"
  );
  const profilePageIndicatorSelector = ".mn-connections";

  await page
    .waitFor(profilePageIndicatorSelector, { timeout: 5000 })
    .catch(() => {
      logger.warn("connections", "connections selector was not found");
    });

  logger.info("connections", "scrolling page to the bottom");
  await scrollToPageBottom(page);

  if (waitTimeToScrapMs) {
    logger.info("connections", `applying 1st delay`);
    await new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, waitTimeToScrapMs / 2);
    });
  }

  logger.info("connections", "clicking on see more buttons");
  await seeMoreButtons.clickAll(page);

  if (waitTimeToScrapMs) {
    logger.info("connections", `applying 2nd delay`);
    await new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, waitTimeToScrapMs / 2);
    });
  }

  const connections = await scrapSection(page, {
    selector: ".mn-connection-card",
    fields: {
      profile: {
        selector: "a.mn-connection-card__link",
        attribute: "href"
      },
      name: ".mn-connection-card__name"
    }
  });

  await page.close();
  logger.info("connections", `finished scraping`);

  return connections;
};
