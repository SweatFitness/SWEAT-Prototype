//Lets require/import the HTTP module
var express = require('express');
var app = express();
var bodyparser = require('body-parser');
app.use(bodyparser.json());

app.listen(process.env.PORT || 8080);


app.get('/', function(req, res) {
    console.log('some req happened');
        var jsonStr = '';

        req.on('data', function(data) {
            jsonStr += data;
        });

        req.on('end', function() {
            console.log(JSON.parse(jsonStr));
        });

        res.send('hello');
});

app.post('/', function(req, res) {
    console.log('received post');
    var jsonStr = '';

        req.on('data', function(data) {
            jsonStr += data;
        });

        req.on('end', function() {
            console.log(JSON.parse(jsonStr));
        });
});
