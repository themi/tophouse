// Initialize the Amazon Cognito credentials provider
AWS.config.region = 'ap-southeast-2'; // Region
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'ap-southeast-2:7ef20e3e-affb-48c3-8d6d-b1669c2f69ad',
});

var albumBucketName = "hemi-uploads";

var s3 = new AWS.S3({
    apiVersion: "2006-03-01",
    params: { Bucket: albumBucketName }
});

// A utility function to create HTML.
function getHtml(template) {
    return template.join('\n');
}

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
                "<h2>Albums</h2>",
                message,
                "<ul class='list-group list-group-flush'>",
                getHtml(albums),
                "</ul>",
                "<button onclick=\"createAlbum(prompt('Enter Album Name:'))\" class='btn btn-primary'>",
                "Create New Album",
                "</button>"
            ];
            document.getElementById("app").innerHTML = getHtml(htmlTemplate);
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
    var albumKey = encodeURIComponent(albumName);
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
    var albumPhotosKey = encodeURIComponent(albumName) + "/";
    s3.listObjects({ Prefix: albumPhotosKey }, function(err, data) {
        if (err) {
            return alert("There was an error viewing your album: " + err.message);
        }
        // 'this' references the AWS.Response instance that represents the response
        var href = this.request.httpRequest.endpoint.href;
        var bucketUrl = href + albumBucketName + "/";

        var photos = data.Contents.map(function(photo) {
            var photoKey = photo.Key;
            var photoUrl = bucketUrl + encodeURIComponent(photoKey);
            return getHtml([
                "<div class='image-slide'>",
                "<figure>",
                "<figcaption>",
                photoKey.replace(albumPhotosKey, ""),
                "</figcaption>",
                '<img src="' + photoUrl + '" class="thumbnail"/>',
                "</figure>",
                "<button onclick=\"deletePhoto('" +
                albumName +
                "','" +
                photoKey +
                "')\" class='btn btn-danger'>",
                "<i class='fas fa-trash'></i>",
                "</button>",
                "</div>"
            ]);
        });
        var message = photos.length ?
            "" :
            "<p>You do not have any photos in this album. Please add photos.</p>";
        var htmlTemplate = [
            "<h2>",
                "Album: " + albumName,
            "</h2>",
            message,
            "<div class='image-container'>",
                getHtml(photos),
            "</div>",
            '<div class="input-group mb-3 uploader">',
                '<div class="custom-file">',
                    '<input type="file" class="custom-file-input" id="photoupload" onchange="showFileName(this)"/>',
                    '<label class="custom-file-label" for="photoupload" aria-describedby="addphoto">',
                        'Choose file',
                    '</label>',
                '</div>',
                '<div class="input-group-append">',
                    '<button class="input-group-text" id="addphoto" onclick="addPhoto(\'' + albumName + "')\">",
                    'Upload',
                    '</button>',
                '</div>',
            '</div>',
            '<button onclick="listAlbums()" class="btn btn-primary">',
                'Back To Albums',
            '</button>'
        ];
        document.getElementById("app").innerHTML = getHtml(htmlTemplate);
    });
}

function showFileName(el) {
    var fileName = el.value;
    el.nextElementSibling.innerHTML = fileName;
}

function addPhoto(albumName) {
    var files = document.getElementById("photoupload").files;
    if (!files.length) {
        return alert("Please choose a file to upload first.");
    }
    var file = files[0];
    var fileName = file.name;
    var albumPhotosKey = encodeURIComponent(albumName) + "/";

    var photoKey = albumPhotosKey + fileName;

    // Use S3 ManagedUpload class as it supports multipart uploads
    var upload = new AWS.S3.ManagedUpload({
        params: {
            Bucket: albumBucketName,
            Key: photoKey,
            Body: file,
            ACL: "public-read"
        }
    });

    var promise = upload.promise();

    promise.then(
        function(data) {
            alert("Successfully uploaded photo.");
            viewAlbum(albumName);
        },
        function(err) {
            return alert("There was an error uploading your photo: ", err.message);
        }
    );
}

function deletePhoto(albumName, photoKey) {
    s3.deleteObject({ Key: photoKey }, function(err, data) {
        if (err) {
            return alert("There was an error deleting your photo: ", err.message);
        }
        alert("Successfully deleted photo.");
        viewAlbum(albumName);
    });
}

function deleteAlbum(albumName) {
    var albumKey = encodeURIComponent(albumName) + "/";
    s3.listObjects({ Prefix: albumKey }, function(err, data) {
        if (err) {
            return alert("There was an error deleting your album: ", err.message);
        }
        var objects = data.Contents.map(function(object) {
            return { Key: object.Key };
        });
        s3.deleteObjects({
                Delete: { Objects: objects, Quiet: true }
            },
            function(err, data) {
                if (err) {
                    return alert("There was an error deleting your album: ", err.message);
                }
                alert("Successfully deleted album.");
                listAlbums();
            }
        );
    });
}
