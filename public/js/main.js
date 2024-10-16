function editTags(elem) {
  const $parent = $(elem).parents(".contact-tags-container");

  $parent.find(".contact-tags-form").removeClass("d-none");

  $parent.find(".contact-tags").addClass("d-none");

  initSelect2($parent.find(".contact-tags-input"), "Contact tags");
}

var tops = {};

function showMore() {
  const $link = $(this);
  const username = $link.attr("data-username");
  const $row = $link.parents("tr").first();
  const myTopIndex = "p" + $("#connections-data tr").index($row);
  tops[myTopIndex] = $row.offset().top - 60;

  $.get(`/profile/${username}`).then(profile => {
    const $moreView = $('<tr class="more-view"></tr>');
    $moreView.append(`
      <td colspan="6">
      <div class="more-view-content">
        <h5>More Information</h5>
        <div>
          <b>Location:</b> ${profile.profile.location ||
            '<em class="text-muted">&#x25CF;</em>'}
        </div>
        <div>
          <b>Connections:</b> ${profile.profile.connections ||
            '<em class="text-muted">&#x25CF;</em>'}
        </div>
        <div class="d-flex align-items-center">
            <div>
            ${profile.contact
              .map(item => `<b>${item.type}</b>: ${item.values.join(", ")}`)
              .join("<br>")}
            </div>
          </div>
        <div>
          <b>Summary:</b>
          <div class="summary">
          ${profile.profile.summary || '<em class="text-muted">&#x25CF;</em>'}
          </div>
        </div>

        <h5>Positions</h5>
        <div class="positions">
          ${
            profile.positions.length > 0
              ? profile.positions
                  .map(
                    position => `
            <div class="position">
              <b>${position.date1 || position.date2 || "Date Unknown"}:</b> ${
                      position.title
                    } at ${position.companyName} ${
                      typeof position.location !== "undefined"
                        ? `in ${position.location}`
                        : ""
                    }
            </div>
            `
                  )
                  .join("")
              : "<em>No data available</em>"
          }
        </div>

        <h5>Education</h5>
        <div class="educations">
          ${
            profile.educations.length > 0
              ? profile.educations
                  .map(
                    education => `
            <div class="education">
              <b>${education.date2 || "Date Unknown"}:</b> ${
                      education.degree
                    } in ${education.fieldofstudy} from ${education.title}
            </div>
            `
                  )
                  .join("")
              : "<em>No data available</em>"
          }
        </div>
        </div>
      </td>
    `);

    $row.after($moreView);

    for (
      let i = parseInt(myTopIndex.substr(1), 10) + 1;
      i < $("#connections-data tr").length;
      i++
    ) {
      if (tops[`p${i}`]) {
        tops[`p${i}`] += $moreView.height();
      }
    }

    $(window).scroll(function() {
      if (
        $(window).scrollTop() >= tops[myTopIndex] &&
        $(window).scrollTop() < tops[myTopIndex] + $moreView.height() - 95
      ) {
        $row.addClass("fixed-view");
      } else {
        $row.removeClass("fixed-view");
      }
    });
  });
}

function showProfiles(profiles, chunkIndex) {
  const profilesMarkup = profiles
    .map(profile => {
      const emails = profile.contact.filter(
        item => item.type === "Email" || item.type === "Emails"
      );
      const phones = profile.contact.filter(
        item => item.type === "Phone" || item.type === "Phones"
      );
      const location = profile.profile.location;
      const websites = profile.contact.filter(
        item => item.type === "Website" || item.type === "Websites"
      );

      return `
      <tr>
        <td style="min-width: 250px;">
          <div class="d-flex align-items-center">
            <img class="avatar lazy" width="70" height="70" style="border-radius: 100%; margin-right: 10px; border: 1px solid #ccc;" src="/img/default-avatar.jpg" data-src="${
              !profile.avatar || profile.avatar.indexOf("base64") > -1
                ? "/img/default-avatar.jpg"
                : profile.avatar
            }" alt="${profile.username}">
            <div>
              ${
                !profile.basic
                  ? `<a href="javascript:void(0)" class="view-profile" data-username="${profile.username}">${profile.profile.name}</a>`
                  : `<b>${profile.profile.name}</b>`
              }
              <br>
              <span class="headline">${profile.profile.headline}</span>
            </div>
          </div>
        </td>
        <td style="min-width: 200px; font-size: 13px;">
          <div class="contact-tags-container" style="padding-top: 12px; width: 100%;">
            <div style="width: 100%">
            <div class="contact-tags">
              <span class="tags">
                ${
                  profile.tags && profile.tags.length > 0
                    ? profile.tags.map(tag => `<b>${tag}</b>`).join(", ")
                    : '<span class="text-muted">Untagged</span>'
                }
              </span>
              <a href="javascript:void(0)" onclick="editTags(this)" style="font-size: 0.75rem;">Edit</a>
            </div>
            <div class="contact-tags-form d-none">
              <select
                class="contact-tags-input"
                name="${profile.username}"
                class="form-control"
                style="width: 100%; display: block;"
                placeholder="Contact tags"
                multiple
              >
                ${
                  profile.tags && profile.tags.length > 0
                    ? profile.tags
                        .map(
                          tag =>
                            `<option value="${tag}" selected>${tag}</option>`
                        )
                        .join("")
                    : ""
                } 
              </select>

              <div style="width: 100%; display: block; margin-top: 10px;" >
                <button class="btn btn-primary btn-sm" href="javascript:void(0)" onclick="saveTags(this)">Save Tags</button>
              </div>
              </div>
            </div>
          </div>
        </td>
        <td style="max-width: 200px; font-size: 13px;">
          <div class="d-flex align-items-center" style="padding-top: 12px; width: 100%;">
            <div>
            ${
              emails.length > 0
                ? emails.map(item => `${item.values.join("<br>")}`).join("")
                : '<em class="text-muted">&#x25CF;</em>'
            }
            </div>
          </div>
        </td>
        <td style="font-size: 13px;">
          <div class="d-flex align-items-center" style="padding-top: 12px; width: 100%;">
            <div>
            ${
              phones.length > 0
                ? phones.map(item => `${item.values.join("<br>")}`).join("")
                : '<em class="text-muted">&#x25CF;</em>'
            }
            </div>
          </div>
        </td>
        <td style="min-width: 200px; font-size: 13px;">
          <div class="d-flex align-items-center" style="padding-top: 12px; width: 100%;">
            <div>
            ${location ? location : '<em class="text-muted">&#x25CF;</em>'}
            </div>
          </div>
        </td>
        <td style="min-width: 200px; font-size: 13px;">
          <div class="d-flex align-items-center" style="padding-top: 12px; width: 100%;">
            <div>
            ${
              websites.length > 0
                ? websites
                    .map(
                      item =>
                        `${item.values
                          .map(website => {
                            return website.replace(/(.*)\((.*)\)/, function(
                              string,
                              link,
                              title
                            ) {
                              return `<a class="website" target="_blank" href="http://${$.trim(
                                link
                              )}">${$.trim(title)}</a>`;
                            });
                          })
                          .join("<br>")}`
                    )
                    .join("")
                : '<em class="text-muted">&#x25CF;</em>'
            }
            </div>
          </div>
        </td>
      </tr>
      `;
    })
    .join("");

  $("#connections-data").replaceWith($("#connections-data").clone());
  if (chunkIndex !== 0) {
    $("#connections-data").append(profilesMarkup);
  } else {
    $("#connections-data").html(profilesMarkup);
  }
  $(".lazy").Lazy({
    threshold: 0,
    throttle: 2000
  });
}

function showLoading() {
  $("#connections-data").html(`
    <tr>
      <td colspan="6">Loading...</td>
    </tr>
  `);
}

function showError() {
  $("#connections-data").html(`
    <tr>
      <td colspan="6"><span class="text-danger">Error</span></td>
    </tr>
  `);
}

function search(e) {
  e.preventDefault();

  showLoading();

  $.post("/search", $(e.target).serialize())
    .then(chunkShowProfiles)
    .catch(err => {
      showError();
    });
}

function saveTags(elem) {
  const $parent = $(elem).parents(".contact-tags-container");

  const $input = $parent.find(".contact-tags-input");
  const username = $input.attr("name");
  const tags = $input.val();

  if (tags.length === 0) {
    $parent
      .find(".contact-tags .tags")
      .html('<span class="text-muted">Untagged</span>');
  } else {
    $parent
      .find(".contact-tags .tags")
      .html(tags.map(tag => `<b>${tag}</b>`).join(", "));
  }

  $.post(`/profile/${username}/tags`, { tags });

  $parent.find(".contact-tags-form").addClass("d-none");

  $parent.find(".contact-tags").removeClass("d-none");
}

function initSelect2($elem, placeholder) {
  $elem.select2({
    tags: true,
    placeholder,
    createTag: function(params) {
      return {
        id: params.term,
        text: params.term,
        newOption: true
      };
    },
    templateResult: function(data) {
      var $result = $("<span></span>");

      $result.text(data.text);

      return $result;
    }
  });
}

function chunk(arr, len) {
  var chunks = [],
    i = 0,
    n = arr.length;

  while (i < n) {
    chunks.push(arr.slice(i, (i += len)));
  }

  return chunks;
}

function debounce(func, wait, immediate) {
  var timeout;
  return function() {
    var context = this,
      args = arguments;
    var later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

function chunkShowProfiles(profiles) {
  let chunkIndex = 0;
  const profileChunks = chunk(profiles, 100);

  if (profileChunks.length) {
    showProfiles(profileChunks[0], chunkIndex);

    window.onscroll = debounce(function() {
      if (
        document.documentElement.scrollTop + window.innerHeight >
        document.documentElement.scrollHeight - 600
      ) {
        chunkIndex++;
        if (profileChunks[chunkIndex]) {
          showProfiles(profileChunks[chunkIndex], chunkIndex);
        } else {
          window.onscroll = undefined;
          return;
        }
      }
    }, 200);
  } else {
    showProfiles([], 0);
  }
}

$(function() {
  initSelect2($("#filter-tags"), "Filter tags");

  $("#search-form").on("submit", search);

  $(document).on("click", ".view-profile", showMore);

  $.get("/profiles").then(chunkShowProfiles);
  $.get("/scraped-profiles-count").then(count => {
    $("#scraped-count").html(`<small><b>${count} Profiles Scraped</b></small>`);
  });
});
