function listAlbums() {
    s3.listObjects({ Delimiter: "/" }, function(err, data) {
        if (err) {
            return alert("There was an error listing your albums: " + err.message);
        } else {
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
            document.getElementById("app").innerHTML = getHtml(htmlTemplate);
            // how do you fire .tooltip(); without jquery notation?
            $('[data-toggle="tooltip"]').tooltip();
        }
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
    var albumKey = encodeURIComponent(albumName) + "/" + albumPlaceHolder;
    s3.headObject({ Key: albumKey }, function(err, data) {
        if (!err) {
            return alert("Album already exists.");
        }
        if (err.code !== "NotFound") {
            return alert("There was an error creating your album: " + err.message);
        }
        s3.putObject({ Key: albumKey }, function(err, data) {
            if (err) {
                return alert("There was an error creating your album: " + err.message);
            }
            alert("Successfully created album.");
            viewAlbum(albumName);
        });
    });
}

function viewAlbum(albumName) {
    var albumMediaKey = encodeURIComponent(albumName) + "/";
    var placeHolderKey = albumMediaKey + albumPlaceHolder;
    s3.listObjectsV2({ Prefix: albumMediaKey }, function(err, data) {
        if (err) {
            return alert("There was an error viewing your album: " + err.message);
        }
        // 'this' references the AWS.Response instance that represents the response
        var href = this.request.httpRequest.endpoint.href;
        var bucketUrl = href + albumBucketName + "/";

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
                '<span id="media_' + keyToId(mediaFileName) + '"></span>',
                createMediaTag(albumBucketName, mediaFileName, mediaUrl),
                "</figure>",
                "<button onclick=\"deleteMedia('" + albumName + "','" + mediaFileName + "')\" class='btn btn-danger media-btn'>",
                "<i class='fas fa-trash'></i>",
                "</button>",
                "<button onclick=\"editMediaTags('" + albumName + "','" + mediaFileName + "')\" id='description_" + keyToId(mediaFileName) + "' data-toggle='tooltip' data-placement='top' class='btn btn-success media-btn'>",
                "<i class='fas fa-book-open'></i>",
                "</button>",
                "<button onclick=\"editMediaTags('" + albumName + "','" + mediaFileName + "')\" id='hashtags_" + keyToId(mediaFileName) + "' data-toggle='tooltip' data-placement='top' class='btn btn-info media-btn'>",
                "<i class='fas fa-hashtag'></i>",
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
        document.getElementById("app").innerHTML = getHtml(htmlTemplate);
        // how do you fire .tooltip(); without jquery notation?
        $('[data-toggle="tooltip"]').tooltip();
    });
}

function keyToId(filename) {
    return filename.replace('/', '_').replace('.', '_').replace(' ', '_');
}

function createMediaTag(bucketName, filename, url) {
    var headerRequest = renderMediaHtml(bucketName, filename, url);
    var tagsRequest = downloadTagging(bucketName, filename);

    Promise.all([headerRequest, tagsRequest]).then(function(values) {
        // yeah nah dont do anything just yet
    });

    return '';
}

function renderMediaHtml(bucketName, filename, url) {
    var params = {
        Bucket: bucketName,
        Key: filename
    };
    var headerRequest = s3.headObject(params);

    headerRequest.send(function(error, data) {
        if (error) {
            // console.log(error.message);
        } else {
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
        }
    });
    return headerRequest;
}

function editMediaTags(bucketName, filename) {
    var desc = document.getElementById("description_" + keyToId(filename)).getAttribute("data-original-title");
    var htags = document.getElementById("hashtags_" + keyToId(filename)).getAttribute("data-original-title");
    mediaTagsForm(bucketName, filename, desc, htags);
}

function renderMediaTagging(filename, description, hashtags) {
    document.getElementById("description_" + keyToId(filename)).setAttribute("data-original-title", description);
    document.getElementById("hashtags_" + keyToId(filename)).setAttribute("data-original-title", hashtags);
}
