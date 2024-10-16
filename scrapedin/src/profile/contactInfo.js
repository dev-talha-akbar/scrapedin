const logger = require("../logger");

const showSelector = "a[data-control-name=contact_see_more]";
const scrapSection = require("../scrapSection");

const template = {
  selector: ".pv-contact-info__contact-type",
  fields: {
    type: "header",
    values: {
      selector: ".pv-contact-info__ci-container",
      isMultipleFields: true
    }
  }
};
const getContactInfo = async page => {
  await page.waitFor(showSelector, { timeout: 2000 }).catch(() => {
    logger.warn("contact-info", "selector not found");
    return {};
  });

  const element = await page.$(showSelector);
  const rect = await page.evaluate(_elem => {
    const { top, left, bottom, right } = _elem.getBoundingClientRect();
    return { top, left, bottom, right };
  }, element);
  await page.mouse.move(rect.top, rect.left);
  await element.click();
  await new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, 500);
  });

  const contactInfo = await scrapSection(page, template);

  return contactInfo;
};

module.exports = getContactInfo;
