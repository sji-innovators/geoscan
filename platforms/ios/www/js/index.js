// Adapted from several examples

var pictureSource;   // picture source
var destinationType; // sets the format of returned value

document.addEventListener("deviceready",onDeviceReady,false);

function onDeviceReady() {
    pictureSource=navigator.camera.PictureSourceType;
    destinationType=navigator.camera.DestinationType;
    alert("Welcome")
}

function capturePhoto() {
    // Take picture using device camera and retrieve image as base64-encoded string
    navigator.camera.getPicture(onPhotoSuccess, onFail, {
        quality: 50,
        destinationType: destinationType.DATA_URL,
        correctOrientation: true,
        saveToPhotoAlbum: true  });
}

function getPhoto() {
    // Retrieve image file location from specified source
    navigator.camera.getPicture(onPhotoSuccess, onFail, { quality: 70,
        destinationType: destinationType.DATA_URL,
        sourceType: navigator.camera.PictureSourceType.SAVEDPHOTOALBUM,
        correctOrientation: true });
}

function onPhotoSuccess(imageURI) {
    // Called on success
    console.log(imageURI)
    var image = new Image();
    image.src = imageURI
    image.onload = function() {
        var lightinten = 0;

        window.plugin.lightsensor.getReading(
            function success(reading){
                lightinten = reading.intensity
            },
            function error(message){
                console.warn("Error, "+message)
            }
        )

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
                var avgrgb = (red+green+blue)/3
                if(avgrgb < parseInt(document.getElementById("threshold").value)) {
                    dark=dark+1
                    //console.log("Dark")
                }if(avgrgb >= parseInt(document.getElementById("threshold").value)){
                    light=light+1
                    //console.log("Light")
                }
            }
        }
        alert('Light: '+String(light)+', Dark: '+String(dark)+" - Percent dark: "+String(dark/((light+dark)/100))+', LUX: '+lightinten)
        storedat(imageURI, light, dark, lightinten)
    };
    image.src = 'data:image/jpg;base64, '+imageURI
}

function storedat(imgb64, light, dark, lux){
    NativeStorage.setItem(String(Date.now()),{
        name:String(Date.now()),
        img:imgb64,
        light:light,
        dark:dark,
        percentage:(dark/((light+dark)/100)),
        lux:lux
    }, storeyes, storeno);
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

document.getElementById("capture").addEventListener("click", capturePhoto);
document.getElementById("select").addEventListener("click", getPhoto);
document.getElementById("deldat").addEventListener("click", deldat);



setInterval(function(){
    window.plugin.lightsensor.getReading(
        function success(reading){
            document.getElementById("lum").innerHTML = String(reading.intensity)+"<br/>Lux<br/>(From face facing sensor)"
        },
        function error(message){
            document.getElementById("lum").innerHTML = message
        }
    )
},500)