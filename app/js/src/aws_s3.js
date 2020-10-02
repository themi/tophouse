var albumBucketName = "hemi-uploads";
var albumPlaceHolder = "_manifest";

var s3 = new AWS.S3({
    apiVersion: "2006-03-01",
    params: { Bucket: albumBucketName }
});

function requestUploadMedia(albumName, file, progressBar, callback) {
    var albumMediaKey = encodeURIComponent(albumName) + "/";

    var mediaFileName = albumMediaKey + file.name;

    var request = new AWS.S3.ManagedUpload({
        params: {
            Bucket: albumBucketName,
            Key: mediaFileName,
            Body: file,
            ACL: "public-read",
            ContentType: file['type'],
            ContentLength: file['length']
        }
    });

    request.on('httpUploadProgress', function(evt) {
        var uploaded = Math.round(evt.loaded / evt.total * 100);
        progressBar.style.width = uploaded + "%";
        progressBar.innerHTML = uploaded + "%";
    });

    request.send(function(error, data) {
        if (error) {
            return alert("There was an error uploading your file: ", error.message);
        } else {
            callback(data);
        }
    });

    return request;
}

function requestPutObjectsTags(bucketName, filename, description, hashtags, callback) {
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

    var request = s3.putObjectTagging(params);

    request.send(function(error, data) {
        if (error) {
            return alert(error.message);
        }
        callback(data);
    });

    return request;
}

function requestObjectsTags(bucketName, filename, callback) {
    var params = {
        Bucket: bucketName,
        Key: filename
    };

    var request = s3.getObjectTagging(params);

    request.send(function(error, data) {
        if (error) {
            // console.log(error, error.stack); // an error occurred
        } else {
            callback(data);
        }
    });

    return request;
}


function requestObjectHeaders(bucketName, filename, callback) {
    var params = {
        Bucket: bucketName,
        Key: filename
    };
    var request = s3.headObject(params);

    request.send(function(error, data) {
        if (error) {
            // console.log(error.message);
        } else {
            callback(data)
        }
    });
    return request;
}

function requestViewAlbum(albumMediaKey, callback) {
    var placeHolderKey = albumMediaKey + albumPlaceHolder;
    var params = { Prefix: albumMediaKey };
    var request = s3.listObjectsV2(params);
    request.send(function(error, data) {
        if (error) {
            return alert("There was an error viewing your album: " + error.message);
        }
        // 'this' references the AWS.Response instance that represents the response
        var href = this.request.httpRequest.endpoint.href;
        var bucketUrl = href + albumBucketName + "/";
        callback(data, placeHolderKey, bucketUrl);
    });
    return request;
}

function requestCreateAlbum(albumName, callback) {
    var albumKey = encodeURIComponent(albumName) + "/" + albumPlaceHolder;

    var params = { Key: albumKey };
    var request = s3.headObject(params);
    request.send( function(error, data) {
        if (!error) {
            return alert("Album already exists.");
        }
        if (error.code !== "NotFound") {
            return alert("There was an error creating your album: " + error.message);
        }
        s3.putObject({ Key: albumKey }, function(error, data) {
            if (error) {
                return alert("There was an error creating your album: " + error.message);
            }
            callback(data);
        });
    });
    return request;
}

function requestDeleteAlbum(albumName, callback) {
    var albumKey = encodeURIComponent(albumName) + "/";

    var params = { Prefix: albumKey };

    var deleteRequest = s3.listObjectsV2(params);

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
                callback(data);
            }
        );
    });
    return deleteRequest;
}

function requestDeleteMedia(fileName, callback) {
    var params = {
        Key: fileName
    };

    var request = s3.deleteObject(params);

    request.send(function(error, data) {
        if (error) {
            return alert("There was an error deleting your file: ", error.message);
        }
        callback(data)
    });

    return request;
}

function requestAlbumNames(callback) {
    var params = { Delimiter: "/" };

    var request = s3.listObjectsV2(params);

    request.send( function(error, data) {
        if (error) {
            return alert("There was an error listing your albums: " + error.message);
        }
        callback(data);
    });
    return request;
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
