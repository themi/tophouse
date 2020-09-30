function renderPage(page, callaback) {
    document.getElementById("app").innerHTML = page;
    callaback;
    $('[data-toggle="tooltip"]').tooltip();
}

function renderModal(id, page, callback) {
    document.getElementById("modals").innerHTML = page;
    var thisModal = document.getElementById(id);
    callback(thisModal);
    $('[data-toggle="tooltip"]').tooltip();
    $(thisModal).modal({ backdrop: false });
}

function getHtml(template) {
    return template.join('\n');
}

function assertFileName(el) {
    var fileName = el.value;
    el.nextElementSibling.innerHTML = fileName;
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

function modalDefaultFooter(saveText) {
    if (saveText == null) saveText = "Save changes";
    const htmlString = getHtml([
        '<button type="button" class="btn btn-primary modal-save-button">' + saveText + '</button>',
        '<button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>',
    ]);
    return htmlString;
}


//*******************
// START CUSTOM PAGES
//*******************


function mediaTagsForm(bucketName, filename, description, hashtags) {
    const context = getHtml([
        '<form>',
        '<div class="form-group">',
        '<label for="description" class="col-form-label">Description:</label>',
        '<input type="text" class="form-control" id="description" value="' + description + '">',
        '</div>',
        '<div class="form-group">',
        '<label for="hashtags" class="col-form-label">Hashtags:</label>',
        '<textarea class="form-control" id="hashtags">',
        hashtags,
        '</textarea>',
        '</div>',
        '</form>',
    ]);
    const id = "media_tags_dialog"
    const dialogString = modalBase(id, modalDefaultHeader('Media Tags'), context, modalDefaultFooter());

    renderModal(id, dialogString, function(thisModal){

        thisModal.querySelector('.modal-save-button').addEventListener('click', function() {
            const desc = thisModal.querySelector('#description').value;
            const htags = thisModal.querySelector('#hashtags').value;
            alert("Description:" + desc + "\nHashtags: " + htags + "\n\nApologies, this feature not working just yet.");
            $(thisModal).modal('hide');
        });

        thisModal.addEventListener('shown.bs.modal', function() {
            thisModal.querySelector('#description').trigger('focus')
        });
    });
}

function uploadMediaForm(albumName) {
    const htmlString = getHtml([
        '<form>',
        '<div class="input-group mb-3 uploader">',
        '<div class="custom-file">',
        '<input type="file" class="custom-file-input" id="upload_media" onchange="assertFileName(this)"/>',
        '<label class="custom-file-label" for="upload_media" aria-describedby="upload_media_aria">',
        'Choose file',
        '</label>',
        '<div class="progress-bar">',
        '<span id="pgbar" style="width: 0;"></span>',
        '</div>',
        '</div>',
        '</div>',
        '<div class="form-group">',
        '<label for="description" class="col-form-label">Description:</label>',
        '<input type="text" class="form-control" id="description">',
        '</div>',
        '<div class="form-group">',
        '<label for="hashtags" class="col-form-label">Hashtags:</label>',
        '<textarea class="form-control" id="hashtags"></textarea>',
        '</div>',
        '</form>',
    ]);
    const id = "upload_media_dialog"
    const dialogString = modalBase(id, modalDefaultHeader('Upload File'), htmlString, modalDefaultFooter('Upload'));

    renderModal(id, dialogString, function(thisModal){

        thisModal.querySelector(".modal-save-button").addEventListener("click", function() {
            var bar = thisModal.querySelector("#pgbar");
            var desc = thisModal.querySelector("#description").value;
            var htags = thisModal.querySelector("#hashtags").value;
            var files = thisModal.querySelector("#upload_media").files;

            if (!files.length) {
                alert("Please choose a file to upload first.");
            } else {
                var fileObject = files[0];
                var fileRequest = uploadMedia(albumName, fileObject, bar);
                // wait for object to exist! then...
                // requestPutObjectsTags(bucketName, filename, description, hashtags, function(data){
                //     renderMediaTagging(filename, description, hashtags);
                // });

                // [TODO] how to keep modal open until the file is uploaded
                // $(thisModal).modal('hide');
            }
        });

        thisModal.addEventListener("shown.bs.modal", function() {
            thisModal.querySelector("#description").focus();
        });
    });

}
