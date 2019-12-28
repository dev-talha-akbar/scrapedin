function editTags(elem) {
  const $parent = $(elem).parents(".contact-tags-container");

  $parent.find(".contact-tags-form").removeClass("d-none");

  $parent.find(".contact-tags").addClass("d-none");

  initSelect2($parent.find(".contact-tags-input"), "Contact tags");
}

function showMore() {
  $("#connections-data .more-view").remove();

  const $link = $(this);
  const username = $link.attr("data-username");
  const $row = $link.parents("tr").first();

  $.get(`/profile/${username}`).then(profile => {
    const $moreView = $('<tr class="more-view"></tr>');
    $moreView.append(`
      <td colspan="4">
      <div class="more-view-content">
        <h5>More Information</h5>
        <div>
          <b>Location:</b> ${profile.profile.location ||
            '<em class="text-muted">Not available</em>'}
        </div>
        <div>
          <b>Connections:</b> ${profile.profile.connections ||
            '<em class="text-muted">Not available</em>'}
        </div>
        <div class="d-flex align-items-center">
            <div>
            ${profile.contact
              .map(item => `<b>${item.type}</b>: ${item.values.join(", ")}`)
              .join("<br>")}
            </div>
          </div>
        <div>
          <b>Summary:</b> ${profile.profile.summary ||
            '<em class="text-muted">Not available</em>'}
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
                      position.location ? `in ${position.location}` : ""
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
  });
}

function showProfiles(profiles) {
  const profilesMarkup = profiles
    .map(profile => {
      const emails = profile.contact.filter(item => item.type === "Email");
      const phones = profile.contact.filter(item => item.type === "Phone");

      return `
      <tr>
        <td style="min-width: 50%;">
          <div class="d-flex align-items-center">
            <img class="avatar" width="70" height="70" style="border-radius: 100%; margin-right: 10px; border: 1px solid #ccc;" src="${
              profile.avatar.indexOf("base64") > -1
                ? "/img/default-avatar.jpg"
                : profile.avatar
            }" alt="${profile.username}">
            <div>
              <a href="javascript:void(0)" class="view-profile" data-username="${
                profile.username
              }">${profile.profile.name}</a>
              <span>(@${profile.username})</span>
              <br>
              ${profile.profile.headline}
            </div>
          </div>
        </td>
        <td style="width: 25%;">
          <div class="contact-tags-container" style="padding-top: 10px; width: 100%;">
            <div style="width: 100%">
            <div class="contact-tags">
              <span class="tags">
                ${
                  profile.tags && profile.tags.length > 0
                    ? profile.tags.join(", ")
                    : '<em class="text-muted">No tags yet...</em>'
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
        <td>
          <div class="d-flex align-items-center">
            <div>
            ${
              emails.length > 0
                ? emails.map(item => `${item.values.join("<br>")}`).join("")
                : '<em class="text-muted">Not available</em>'
            }
            </div>
          </div>
        </td>
        <td>
          <div class="d-flex align-items-center">
            <div>
            ${
              phones.length > 0
                ? phones.map(item => `${item.values.join("<br>")}`).join("")
                : '<em class="text-muted">Not available</em>'
            }
            </div>
          </div>
        </td>
      </tr>
      `;
    })
    .join("");

  $("#connections-data").html(profilesMarkup);
}

function showLoading() {
  $("#connections-data").html(`
    <tr>
      <td colspan="4">Loading...</td>
    </tr>
  `);
}

function showError() {
  $("#connections-data").html(`
    <tr>
      <td colspan="4"><span class="text-danger">Error</span></td>
    </tr>
  `);
}

function search(e) {
  e.preventDefault();

  showLoading();

  $.post("/search", $(e.target).serialize())
    .then(showProfiles)
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
      .html('<em class="text-muted">No tags yet...</em>');
  } else {
    $parent.find(".contact-tags .tags").html(tags.join(", "));
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

$(function() {
  initSelect2($("#filter-tags"), "Filter tags");

  $("#search-form").on("submit", search);

  $("#connections-data").on("click", ".view-profile", showMore);

  $.get("/profiles").then(showProfiles);
});
