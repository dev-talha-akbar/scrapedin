function editTags(elem) {
  const $parent = $(elem).parents(".contact-tags-container");

  $parent.find(".contact-tags-form").removeClass("d-none");

  $parent.find(".contact-tags").addClass("d-none");

  initSelect2($parent.find(".contact-tags-input"), "Contact tags");
}

function showProfiles(profiles) {
  const profilesMarkup = profiles
    .map(
      profile => `
      <tr>
        <td>
          <div class="d-flex align-items-center">
            <img class="avatar" width="70" height="70" style="border-radius: 100%; margin-right: 10px; border: 1px solid #ccc;" src="${
              profile.avatar.indexOf("base64") > -1
                ? "/img/default-avatar.jpg"
                : profile.avatar
            }" alt="${profile.username}">
            <div>
              <a href="javascript:void(0)">${profile.profile.name}</a>
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
                <em class="text-muted">No tags yet...</em>
              </span>
              <a href="javascript:void(0)" onclick="editTags(this)" style="font-size: 0.75rem;">Edit tags</a>
            </div>
            <div class="contact-tags-form d-none">
              <select
                class="contact-tags-input"
                name="filter_item_tags[]"
                class="form-control"
                style="width: 100%; display: block;"
                placeholder="Contact tags"
                multiple
              >
                <option value="Investor">Investor</option>
                <option value="Banker">Banker</option>
                <option value="Software Engineer">Software Engineer</option>
                <option value="Web Developer">Web Developer</option>
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
            ${profile.contact
              .map(item => `<b>${item.type}</b>: ${item.values.join(", ")}`)
              .join("<br>")}
            </div>
          </div>
        </td>
      </tr>
      `
    )
    .join("");

  $("#connections-data").html(profilesMarkup);
}

function showLoading() {
  $("#connections-data").html(`
    <tr>
      <td colspan="3">Loading...</td>
    </tr>
  `);
}

function showError() {
  $("#connections-data").html(`
    <tr>
      <td colspan="3"><span class="text-danger">Error</span></td>
    </tr>
  `);
}

function search(e) {
  e.preventDefault();

  showLoading();

  $.post("/search", $(e.target).serialize())
    .then(profiles => {
      showProfiles(profiles);
    })
    .catch(err => {
      showError();
    });
}

function saveTags(elem) {
  const $parent = $(elem).parents(".contact-tags-container");

  const tags = $parent.find(".contact-tags-input").val();

  if (tags.length === 0) {
    $parent
      .find(".contact-tags .tags")
      .html('<em class="text-muted">No tags yet...</em>');
  } else {
    $parent.find(".contact-tags .tags").html(tags.join(", "));
  }

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

      if (data.newOption) {
        $result.append(" <em>(new)</em>");
      }

      return $result;
    }
  });
}

$(function() {
  $("#search-form").on("submit", search);

  Promise.all([$.get("/profiles"), $.get("/tags")]).then(([profiles, tags]) => {
    const tagsMarkup = tags
      .filter(({ name }) => name && name !== "null")
      .map(
        ({ name }) => `
      <option value="${name}">${name}</option>
    `
      );

    $("#filter-tags").html(tagsMarkup);
    initSelect2($("#filter-tags"), "Filter tags");

    showProfiles(profiles);
  });
});
