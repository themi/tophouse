// Initialize the Amazon Cognito credentials provider
// and default to the UnAuthorised Role
AWS.config.region = 'ap-southeast-2'; // Region
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'ap-southeast-2:7ef20e3e-affb-48c3-8d6d-b1669c2f69ad',
});

var albumBucketName = "hemi-uploads";
var albumPlaceHolder = "_manifest";

var s3 = new AWS.S3({
    apiVersion: "2006-03-01",
    params: { Bucket: albumBucketName }
});

function uploadMedia(albumName, file, progressBar) {
    var albumMediaKey = encodeURIComponent(albumName) + "/";

    var mediaFileName = albumMediaKey + file.name;

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
        progressBar.style.width = uploaded + "%";
        progressBar.innerHTML = uploaded + "%";
    });

    uploadRequest.send(function(error, data) {
        if (error) {
            return alert("There was an error uploading your file: ", error.message);
        } else {
            viewAlbum(albumName);
        }
    });

    return uploadRequest;
}

function uploadTagging(bucketName, filename, description, hashtags) {
    var params = {
        Bucket: bucketName,
        Key: filename,
        Tagging: {
            TagSet: [{
                    Key: "Description",
                    Value: '"' + description + '"'
                },
                {
                    Key: "Hashtags",
                    Value: '"' + hashtags + '"'
                }
            ]
        }
    };

    var uploadRequest = s3.putObjectTagging(params);

    uploadRequest.send(function(error, data) {
        if (error) {
            alert(error.message)
        } else {
            console.log(data)
            renderMediaTagging(filename, description, hashtags);
        };
    });
    return uploadRequest;
}

function downloadTagging(bucketName, filename) {
    var params = {
        Bucket: bucketName,
        Key: filename
    };

    var downloadRequest = s3.getObjectTagging(params);

    downloadRequest.send(function(error, data) {
        if (error) {
            // console.log(error, error.stack); // an error occurred
        } else {
            var description = searchTagsByKey(data.TagSet, "Description")
            var hashtags = searchTagsByKey(data.TagSet, "Hashtags")
            renderMediaTagging(filename, description, hashtags);
        }
    });

    return downloadRequest;
}

function deleteAlbum(albumName) {
    if (confirm('Delete Album - Are you sure?') != true) {
        return false;
    }

    var albumKey = encodeURIComponent(albumName) + "/";

    var params = { Prefix: albumKey };

    var deleteRequest = s3.listObjects(params);

    deleteRequest.send(function(error, data) {
        if (error) {
            return alert("There was an error deleting your album: ", error.message);
        }
        var objects = data.Contents.map(function(object) {
            return { Key: object.Key };
        });

        var paramsDelete = {
            Delete: { Objects: objects, Quiet: true }
        }

        var bulkRequest = s3.deleteObjects(paramsDelete);

        bulkRequest.send(
            function(error, data) {
                if (error) {
                    return alert("There was an error deleting your album: ", error.message);
                }
                alert("Successfully deleted album.");
                listAlbums();
            }
        );
    });
    return deleteRequest;
}


function deleteMedia(albumName, fileName) {
    var params = {
        Key: fileName
    };

    var deleteRequest = s3.deleteObject(params);

    deleteRequest.send(function(error, data) {
        if (error) {
            return alert("There was an error deleting your file: ", error.message);
        }
        alert("Successfully deleted file.");
        viewAlbum(albumName);
    });

    return deleteRequest;
}


function searchTagsByKey(tags, key) {
    var found = null;

    for (var i = 0; i < tags.length; i++) {
        var element = tags[i];

        if (element.Key == key) {
            found = element.Value;
        }
    }

    if (found == null) return "No " + key;

    return found;
}
