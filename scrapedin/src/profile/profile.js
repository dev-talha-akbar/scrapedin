const openPage = require("../openPage");
const scrapSection = require("../scrapSection");
const scrollToPageBottom = require("./scrollToPageBottom");
const seeMoreButtons = require("./seeMoreButtons");
const contactInfo = require("./contactInfo");
const template = require("./profileScraperTemplate");
const cleanProfileData = require("./cleanProfileData");

const logger = require("../logger");

module.exports = async (
  browser,
  cookies,
  url,
  waitTimeToScrapMs = 500,
  hasToGetContactInfo = false
) => {
  logger.info("profile", `starting scraping url: ${url}`);
  const page = await openPage(browser, cookies, url);
  const profilePageIndicatorSelector = ".pv-profile-section";

  const INTERVAL = setInterval(() => {
    if (!page.isClosed()) {
      page.evaluate(() =>
        window.scrollTo(0, parseInt(Math.random() * 500), 10)
      );
      page.mouse.move(
        parseInt(Math.random() * 500, 10),
        parseInt(Math.random() * 500, 10),
        {
          steps: Math.random() * 100
        }
      );
    } else {
      clearInterval(INTERVAL);
    }
  }, parseInt(Math.random() * 500, 10));

  await page
    .waitFor(profilePageIndicatorSelector, { timeout: 5000 })
    .catch(() => {
      logger.warn("profile", "profile selector was not found");
    });

  let elem;
  let rect;

  elem = await page.$(".pv-profile-section");
  rect = await page.evaluate(_elem => {
    const { top, left, bottom, right } = _elem.getBoundingClientRect();
    return { top, left, bottom, right };
  }, elem);
  await page.mouse.move(rect.top, rect.left);

  logger.info("profile", "scrolling page to the bottom");
  await scrollToPageBottom(page);

  if (waitTimeToScrapMs) {
    logger.info("profile", `applying 1st delay`);
    await new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, waitTimeToScrapMs / 2);
    });
  }

  logger.info("profile", "clicking on see more buttons");
  await seeMoreButtons.clickAll(page);

  if (waitTimeToScrapMs) {
    logger.info("profile", `applying 2nd delay`);
    await new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, waitTimeToScrapMs / 2);
    });
  }

  const contact = hasToGetContactInfo ? await contactInfo(page) : {};
  const [profileLegacy] = await scrapSection(page, template.profileLegacy);
  const [profileAlternative] = await scrapSection(
    page,
    template.profileAlternative
  );
  const [aboutLegacy] = await scrapSection(page, template.aboutLegacy);
  const [aboutAlternative] = await scrapSection(
    page,
    template.aboutAlternative
  );
  const positions = await scrapSection(page, template.positions);
  const educations = await scrapSection(page, template.educations);
  const interests = await scrapSection(page, template.interests);

  setTimeout(() => {
    page.close();
  }, parseInt(waitTimeToScrapMs + (Math.random() * (waitTimeToScrapMs * 3), 10)));
  logger.info("profile", `finished scraping url: ${url}`);

  const rawProfile = {
    contact,
    profileLegacy,
    profileAlternative,
    aboutLegacy,
    aboutAlternative,
    positions,
    educations,
    interests
  };

  const cleanedProfile = cleanProfileData(rawProfile);
  return cleanedProfile;
};
