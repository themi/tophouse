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
    var albumMediaKey = encodeURIComponent(albumName) + "/";
    s3.listObjectsV2({ Prefix: albumMediaKey }, function(err, data) {
        if (err) {
            return alert("There was an error viewing your album: " + err.message);
        }
        // 'this' references the AWS.Response instance that represents the response
        var href = this.request.httpRequest.endpoint.href;
        var bucketUrl = href + albumBucketName + "/";

        var mediaObjects = data.Contents.map(function(mediaObject) {
            var mediaFileName = mediaObject.Key;
            var mediaUrl = bucketUrl + encodeURIComponent(mediaFileName);
            var id = keyToId(mediaFileName);
            var htmlString = getHtml([
                "<div class='image-slide'>",
                "<figure>",
                "<figcaption>",
                mediaFileName.replace(albumMediaKey, ""),
                "</figcaption>",
                '<span id="media_'+keyToId(mediaFileName)+'"></span>',
                createMediaTag(albumBucketName,mediaFileName,mediaUrl),
                "</figure>",
                "<button onclick=\"deleteMedia('" +
                albumName +
                "','" +
                mediaFileName +
                "')\" class='btn btn-danger'>",
                "<i class='fas fa-trash'></i>",
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
            '<div class="input-group mb-3 uploader">',
                '<div class="custom-file">',
                    '<input type="file" class="custom-file-input" id="upload_media" onchange="showFileName(this)"/>',
                    '<label class="custom-file-label" for="upload_media" aria-describedby="upload_media_aria">',
                        'Choose file',
                    '</label>',
                    '<div class="progress-bar">',
                        '<span id="pgbar" style="width: 0;"></span>',
                    '</div>',
                '</div>',
                '<div class="input-group-append">',
                    '<button class="input-group-text" id="upload_media_aria" onclick="uploadMedia(\'' + albumName + "')\">",
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

function uploadMedia(albumName) {
    var files = document.getElementById("upload_media").files;
    if (!files.length) {
        return alert("Please choose a file to upload first.");
    }
    var file = files[0];
    var fileName = file.name;
    var albumMediaKey = encodeURIComponent(albumName) + "/";

    var mediaFileName = albumMediaKey + fileName;
    var bar = document.getElementById("pgbar");

    // Use S3 ManagedUpload class as it supports multipart uploads
    var uploadRequest = new AWS.S3.ManagedUpload({
        params: {
            Bucket: albumBucketName,
            Key: mediaFileName,
            Body: file,
            ACL: "public-read",
            ContentType: file['type'],
            ContentLength: file['length']
        }
    });

    uploadRequest.on('httpUploadProgress', function(evt) {
        var uploaded = Math.round(evt.loaded / evt.total * 100);
        bar.style.width = uploaded+"%";
        bar.innerHTML = uploaded+"%";
    });

    uploadRequest.send(function(error, data) {
      if (error) {
        return alert("There was an error uploading your file: ", err.message);
      } else {
        alert("Successfully uploaded media file.");
        viewAlbum(albumName);
      }
    });
}

function deleteMedia(albumName, mediaFileName) {
    s3.deleteObject({ Key: mediaFileName }, function(err, data) {
        if (err) {
            return alert("There was an error deleting your file: ", err.message);
        }
        alert("Successfully deleted file.");
        viewAlbum(albumName);
    });
}

function deleteAlbum(albumName) {
    if ( confirm('Delete Album - Are you sure?') != true ) {
        return false;
    }

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

function showFileName(el) {
    var fileName = el.value;
    el.nextElementSibling.innerHTML = fileName;
}

function keyToId(filename) {
  return filename.replace('/', '_').replace('.', '_').replace(' ', '_');
}

function createMediaTag(bucket,filename,url) {
    var mediaTag = "";
    var params = {
        Bucket: bucket,
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
            '<source src="'+url+'" type="'+data.ContentType+'">',
            "Your browser does not support the video tag.",
            "</video>"
            ]);
            document.getElementById("media_"+keyToId(filename)).innerHTML = mediaTag;
        } else {
            mediaTag = '<img src="'+url+'" class="thumbnail"/>';
            document.getElementById("media_"+keyToId(filename)).innerHTML = mediaTag;
        }
      }
    });

    Promise.all([headerRequest]);

    return mediaTag;
}
