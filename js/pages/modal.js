function renderPage(page) {
    document.getElementById("app").innerHTML = page;
}

function renderModal(page) {
    document.getElementById("modals").innerHTML = page;
}

function getHtml(template) {
    return template.join('\n');
}

//********************
// START TEMPLATE AREA
//********************

function modalBase(id, header, body, footer) {
    const htmlString = getHtml([
        '<div class="modal fade" tabindex="-1" role="dialog" id="' + id + '" >',
        '<div class="modal-dialog modal-dialog-centered" role="document">',
        '<div class="modal-content">',
        '<div class="modal-header bg-dark text-light">',
        header,
        '</div>',
        '<div class="modal-body">',
        body,
        '</div>',
        '<div class="modal-footer">',
        footer,
        '</div>',
        '</div>',
        '</div>',
        '</div>'
    ]);
    return htmlString;
}

function modalDefaultHeader(title) {
    const htmlString = getHtml([
        '<h5 class="modal-title cursive">' + title + '</h5>',
        '<button type="button" class="close" data-dismiss="modal" aria-label="Close">',
        '<span aria-hidden="true">&times;</span>',
        '</button>',
    ]);
    return htmlString;
}

function modalDefaultFooter() {
    const htmlString = getHtml([
        '<button type="button" class="btn btn-primary modal-save-button">Save changes</button>',
        '<button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>',
    ]);
    return htmlString;
}


//*******************
// START CUSTOM PAGES
//*******************


function mediaTagsForm(bucketName, filename, description, hashtags) {
    const htmlString = getHtml([
        '<form>',
        '<div class="form-group">',
        '<label for="description" class="col-form-label">Description:</label>',
        '<input type="text" class="form-control" id="description" value="' + description + '">',
        '</div>',
        '<div class="form-group">',
        '<label for="hashtags" class="col-form-label">Hashtags:</label>',
        '<textarea class="form-control" id="hashtags" value="' + hashtags + '"></textarea>',
        '</div>',
        '</form>',
    ]);
    const id = "media_tags_dialog"
    const dialogString = modalBase(id, modalDefaultHeader('Media Tags'), htmlString, modalDefaultFooter());

    renderModal(dialogString);

    // save action
    $('#' + id + ' .modal-save-button').on('click', function() {
        const thisModal = $('#' + id);
        const desc = thisModal.find('#description').val();
        const htags = thisModal.find('#hashtags').val();
        alert("Description:"+desc+" Hashtags: "+htags+ "\nFeature not working just yet.");
        // const request = setMediaTags(bucketName, filename, desc, htags)
        // Promise.all([request]);
        thisModal.modal('hide');
    });

    // when opened set focus to description input
    $('#' + id).on('shown.bs.modal', function() {
        $('#description').trigger('focus')
    });

    // open the media tags form
    $('#' + id).modal({ backdrop: false });
}
