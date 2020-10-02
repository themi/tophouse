
function listAlbums() {
    requestAlbumNames(function(data) {
        var albums = data.CommonPrefixes.map(function(commonPrefix) {
            var prefix = commonPrefix.Prefix;
            var albumName = decodeURIComponent(prefix.replace("/", ""));
            return getHtml([
                "<li class='list-group-item'>",
                "<button onclick=\"viewAlbum('" + albumName + "')\" class='btn btn-success'>",
                "<i class='fas fa-pencil-alt'></i>",
                albumName,
                "</button>",
                "<button onclick=\"deleteAlbum('" + albumName + "')\" class='btn btn-danger'>",
                "<i class='fas fa-trash'></i>",
                "</button>",
                "</li>"
            ]);
        });
        var message = albums.length ?
            getHtml([
                "<p>Click on an album name to view it.</p>"
            ]) :
            "<p>You do not have any albums. Please Create album.";
        var htmlTemplate = [
            "<h2 class='motto'>Albums</h2>",
            message,
            "<ul class='list-group list-group-flush albums'>",
            getHtml(albums),
            "</ul>",
            '</br>',
            "<button onclick=\"createAlbum(prompt('Enter Album Name:'))\" class='btn btn-primary'>",
            "Create New Album",
            "</button>"
        ];
        renderPage(getHtml(htmlTemplate))
    });
}

function createAlbum(albumName) {
    albumName = albumName.trim();
    if (!albumName) {
        return alert("Album names must contain at least one non-space character.");
    }
    if (albumName.indexOf("/") !== -1) {
        return alert("Album names cannot contain slashes.");
    }
    requestCreateAlbum(albumName, function(data) {
        alert("Successfully created album.");
        viewAlbum(albumName);
    });
}

// [TODO] fix race condition when deleting and listing
function deleteAlbum(albumName) {
    if (confirm('Delete Album - Are you sure?') != true) {
        return false;
    }
    requestDeleteAlbum(albumName, function(data){
        alert("Successfully deleted album.");
        listAlbums();
    })
}

function viewAlbum(albumName) {
    var albumMediaKey = encodeURIComponent(albumName) + "/";

    requestViewAlbum(albumMediaKey, function(data, placeHolderKey, bucketUrl) {
        var mediaObjects = data.Contents.filter(function(mediaObject) {
            if (mediaObject.Key === placeHolderKey) {
                return false; // skip the placeholder
            }
            return true;
        }).map(function(mediaObject) {
            var mediaFileName = mediaObject.Key;
            var mediaUrl = bucketUrl + encodeURIComponent(mediaFileName);
            var id = keyToId(mediaFileName);
            var htmlString = getHtml([
                "<div class='image-slide'>",
                "<figure>",
                "<figcaption>",
                mediaFileName.replace(albumMediaKey, ""),
                "</figcaption>",
                '<span id="media_' + keyToId(mediaFileName) + '">',
                createMediaHtml(albumBucketName, mediaFileName, mediaUrl),
                '</span>',
                "</figure>",
                "<button onclick=\"deleteMedia('" + albumName + "','" + mediaFileName + "')\" class='btn btn-danger media-btn'>",
                "<i class='fas fa-trash'></i>",
                "</button>",
                "<button onclick=\"editMediaTagging('" + albumName + "','" + mediaFileName + "')\" id='description_" + keyToId(mediaFileName) + "' data-toggle='tooltip' data-placement='top' class='btn btn-success media-btn'>",
                "<i class='fas fa-book-open'></i>",
                "</button>",
                "<button onclick=\"editMediaTagging('" + albumName + "','" + mediaFileName + "')\" id='hashtags_" + keyToId(mediaFileName) + "' data-toggle='tooltip' data-placement='top' class='btn btn-info media-btn'>",
                "<i class='fas fa-hashtag'></i>",
                "</button>",
                "<button onclick=\"zoomMedia('" + mediaFileName + "')\" class='btn btn-info media-btn'>",
                "<i class='fas fa-search'></i>",
                "</button>",
                "</div>"
            ]);
            return htmlString;
        });
        var message = mediaObjects.length ?
            "" :
            "<p>You do not have any images in this album. Please add some.</p>";
        var htmlTemplate = [
            "<h2 class='motto'>",
            "Album: " + albumName,
            "</h2>",
            message,
            "<div class='image-container'>",
            getHtml(mediaObjects),
            "</div>",
            "</br>",
            '<button onclick="uploadMediaForm(\'' + albumName + '\')" class="btn btn-primary">',
            'Upload File',
            '</button>',
            '<button onclick="listAlbums()" class="btn btn-primary">',
            'Back To Albums',
            '</button>'
        ];
        renderPage(getHtml(htmlTemplate))
    });
}

function uploadMedia(albumName, file, progressBar) {
    requestUploadMedia(albumName, file, progressBar, function(data){
        viewAlbum(albumName);
    });
}

function deleteMedia(albumName, fileName) {
    requestDeleteMedia(fileName, function(data) {
        alert("Successfully deleted file.");
        viewAlbum(albumName);
    })
}

function renderMediaHtml(bucketName, filename, url) {
    return requestObjectHeaders(bucketName, filename, function(data) {
        if (data.ContentType.split("/")[0] == "video") {
            mediaTag = getHtml([
                "<video controls>",
                '<source src="' + url + '" type="' + data.ContentType + '">',
                "Your browser does not support the video tag.",
                "</video>"
            ]);
            document.getElementById("media_" + keyToId(filename)).innerHTML = mediaTag;
        } else {
            mediaTag = '<img src="' + url + '" class="thumbnail"/>';
            document.getElementById("media_" + keyToId(filename)).innerHTML = mediaTag;
        }
    });
}

function keyToId(filename) {
    return filename.replace('/', '_').replace('.', '_').replace(' ', '_');
}

function createMediaHtml(bucketName, filename, url) {
    var headerRequest = renderMediaHtml(bucketName, filename, url);

    taggingRequest = requestObjectsTags(bucketName, filename, function(data){
        var description = searchTagsByKey(data.TagSet, "Description")
        var hashtags = searchTagsByKey(data.TagSet, "Hashtags")
        renderMediaTagging(filename, description, hashtags);
    });

    // must complete above actions before return
    Promise.all([headerRequest, taggingRequest]);
}

function editMediaTagging(bucketName, filename) {
    var desc = document.getElementById("description_" + keyToId(filename)).getAttribute("data-original-title");
    var htags = document.getElementById("hashtags_" + keyToId(filename)).getAttribute("data-original-title");
    mediaTagsForm(bucketName, filename, desc, htags);
}

function renderMediaTagging(filename, description, hashtags) {
    document.getElementById("description_" + keyToId(filename)).setAttribute("data-original-title", description);
    document.getElementById("hashtags_" + keyToId(filename)).setAttribute("data-original-title", hashtags);
}

function zoomMedia(filename) {
    var el = document.getElementById("media_" + keyToId(filename));
    var media = el.firstChild.cloneNode(true);
    media.classList.remove('thumbnail');
    media.classList.add('full-page');
    zoomImageForm(media);
}
