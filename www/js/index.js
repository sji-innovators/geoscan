// Adapted from several examples

var pictureSource;   // picture source
var destinationType; // sets the format of returned value
var intervalhandler = null;
var lux = 0;

document.addEventListener("deviceready",onDeviceReady,false);

function onDeviceReady() {
    pictureSource=navigator.camera.PictureSourceType;
    destinationType=navigator.camera.DestinationType;
    alert("Welcome")
}





function storedat(imgb64, light, dark, lux){
    var fileUri = imgb64
    window.resolveLocalFileSystemURL(
        fileUri,
        function(fileEntry){
            var newFileUri  = cordova.file.externalApplicationStorageDirectory;
            var oldFileUri  = fileUri;
            console.log("new", newFileUri)
            console.log("old", oldFileUri)
            var newFileName = String((new Date).getTime())+".jpg";
            window.resolveLocalFileSystemURL(newFileUri,
                function(dirEntry) {
                    // move the file to a new directory and rename it
                    console.log("Moving")
                    fileEntry.moveTo(dirEntry, newFileName, function(){
                        console.log("Moved")
                        NativeStorage.setItem(String(Date.now()),{
                            name:newFileName,
                            img:newFileUri+newFileName,
                            light:light,
                            dark:dark,
                            percentage:(dark/((light+dark)/100)),
                            lux:lux
                        }, storeyes, storeno);
                    }, fail);

                },
                fail);
            }, fail)
}

function storeyes(){
    alert("Stored successfully")
}

function storeno(error){
    alert("Storing failed! "+error)
}

function onFail(message) {
    alert('Failed because: ' + message);
}


function deldat(){
    NativeStorage.clear(function(){alert("Cleared")})
}

function share(){
            var intervalhandler = null;
            var values = []
            var jsonval = []
            console.log("Sharing")
            NativeStorage.keys(function(keys){
                console.log("keys", keys)
                if(keys.length <1){
                    alert("You have no photos in storage!");
                    return
                }
                keys.forEach(function(key){
                    NativeStorage.getItem(key, function(value){
                        values.push(value.img)
                        jsonval.push(value)
                        console.log(value.img)
                        console.log(values.length, keys.length)
                    });
                }, function(err){alert(err)})
                console.log(values.length, keys.length)
                intervalhandler = setInterval(function() {
                    console.log("checking")
                    if (values.length == keys.length) {
                        window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function (dirEntry) {
                            var isAppend = false;
                            var fileName = "info.txt"
                            var dataObj = new Blob([JSON.stringify(jsonval)], { type: 'text/plain' });
                            dirEntry.getFile(fileName, {create: true, exclusive: false}, function(fileEntry) {
                                fileEntry.createWriter(function (fileWriter) {

                                    fileWriter.onwriteend = function() {
                                        console.log("Successful file read...", fileEntry);
                                        var options = {
                                            message: 'GeoScan', // not supported on some apps (Facebook, Instagram)
                                            subject: 'GeoScan', // fi. for email
                                            files: values.concat([cordova.file.dataDirectory+"info.txt"]), // an array of filenames either locally or remotely
                                            chooserTitle: 'Choose Google Drive'
                                        };
                                        window.plugins.socialsharing.shareWithOptions(options, function (result) {
                                            alert("Shared")
                                            clearInterval(intervalhandler)
                                            intervalhandler = null;
                                        }, function (err) {
                                            alert(err)
                                            clearInterval(intervalhandler)
                                            intervalhandler = null;
                                        });
                                    };

                                    fileWriter.onerror = fail
                                    fileWriter.write(dataObj);
                                });

                            }, fail);
                        }, fail);

                    }
                }, 1000)
            }, function(err){alert(err)});
}


document.getElementById("capture").addEventListener("click", getPhoto);
document.getElementById("share").addEventListener("click", share);
document.getElementById("select").addEventListener("click", grabPhoto);
document.getElementById("deldat").addEventListener("click", deldat);





setInterval(function(){
    window.plugin.lightsensor.getReading(
        function success(reading){
            document.getElementById("lum").innerHTML = String(reading.intensity)+"<br/>Lux<br/>(From face facing sensor)"
            lux = reading.intensity
        },
        function error(message){
            document.getElementById("lum").innerHTML = message
        }
    )
},500)


function onPhotoSuccess(imageURI) {
    alert("Take note this process may take a very long time(Image processing). Because of the intensity of processing, your phone may freeze, please do not touch the screen until the processing has completed")
    // Called on success
    var image = new Image();
    image.src = imageURI;
    image.onload = function() {
        var lightinten = lux
        var canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        var context = canvas.getContext('2d');
        context.drawImage(image, 0, 0);
        var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        // Now you can access pixel data from imageData.data.
        // It's a one-dimensional array of RGBA values.
        // Here's an example of how to get a pixel's color at (x,y)
        console.log("Processing")
        var light = 0
        var dark = 0

        for (var y = 1; y <= canvas.height; y = y + parseInt(document.getElementById("interval").value)) {
            for (var x = 1; x <= canvas.width; x = x + parseInt(document.getElementById("interval").value)) {
                //console.log("X: "+String(x)+", Y: "+String(y))
                var index = (y * imageData.width + x) * 4;
                var red = imageData.data[index];
                var green = imageData.data[index + 1];
                var blue = imageData.data[index + 2];

                var average = (red + blue + green) / 3;
                //console.log(blue, "rgb("+red+","+green+","+blue+")")
                // if(blue >= parseInt(document.getElementById("highthreshold").value)){
                //     light = light + 1
                // }if(blue < parseInt(document.getElementById("lowthreshold").value)){
                //     dark = dark + 1
                // }
                if (average >= parseInt(document.getElementById("highthreshold").value)) {
                    light = light + 1
                }
                if (average <= parseInt(document.getElementById("lowthreshold").value)) {
                    dark = dark + 1
                }
            }
        }
        alert('Light: ' + String(light) + ', Dark: ' + String(dark) + " - Percent dark: " + String(dark / ((light + dark) / 100)) + ', LUX: ' + lightinten)
        storedat(imageURI,light,dark,lightinten)
        }

}

function getPhoto() {
    navigator.camera.getPicture(onPhotoSuccess, onFail, { quality: 50,
        destinationType: destinationType.FILE_URI,
        sourceType: navigator.camera.PictureSourceType.CAMERA,
        saveToPhotoAlbum: true,
        correctOrientation: true });
}

function grabPhoto() {
    // Retrieve image file location from specified source
    navigator.camera.getPicture(onPhotoSuccess, onFail, { quality: 50,
        destinationType: destinationType.FILE_URI,
        sourceType: navigator.camera.PictureSourceType.SAVEDPHOTOALBUM,
        saveToPhotoAlbum: true,
        correctOrientation: true });
}


function fail(err){
    alert("Error: "+err)
    console.log(err)
}
