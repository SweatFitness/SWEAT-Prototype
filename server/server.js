var express = require('express'),
    app = express(),
    bodyparser = require('body-parser'),
    firebase = require('firebase');

var workoutsRef = new Firebase('https://sweat-fitness.firebaseio.com/workouts');
var usersRef = new Firebase('https://sweat-fitness.firebaseio.com/users');

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
            var matchedID = 

            var currentReq = JSON.parse(jsonStr);
            workoutsRef.once("value", function(data) {
                var snapshot = data.val();
                for (var id in snapshot) {
                    if (snapshot.hasOwnProperty(id)) {
                        if(isMatch(snapshot[id], currentReq)) {
                            console.log('IS A MATCH!!!!');
                            currentReq['matched'] = true;
                            snapshot[id]['matched'] = true;
                            currentReq['partnerUid'] = snapshot[id]['ownerUid'];
                            snapshot[id]['partnerUid'] = currentReq['ownerUid'];

                            updateWorkout(id, snapshot[id]);
                            break;

                        }
                    }
                }
                
                workoutsRef.push(currentReq);
            });
        });

});

var updateWorkout = function(id, data) {
    workoutsRef.update({
        id: data,
    });
}

var saveWorkoutToFirebase = function(data) {
    workoutsRef.set(data);
}

var isMatch = function(data, req) {
    console.log('Checking match...');
    if (data['matched']) {  // already matched. skip!
        return false;
    }
    if (data['confirmed']) {
        return false; // already confirmed. skip!
    }
    if (data['ownerUid'] === req['ownerUid']) {
        return false; // dont wanna match myself. skip!
    }
    if (data['lookingfor'] !== 'Workout Buddy' || req['lookingfor'] !== 'Workout Buddy') {
        return false; // need to be looking for buddy, not trainer. Skip!
    }
    if (data['location'] !== req['location']) {
        return false; // need to be at the same place. skip!
    }
    var firstGuyStartTime = new Date(data['startDateTime']),
        firstGuyEndTime = new Date(data['endDateTime']),
        secondGuyStartTime = new Date(data['startDateTime']),
        secondGuyEndTime = new Date(data['endDateTime']);

    if (dates.inRange(firstGuyStartTime, secondGuyStartTime, secondGuyEndTime)) {
        return true;
    } else if (dates.inRange(secondGuyStartTime, firstGuyStartTime, firstGuyEndTime)) {
        return true;
    } else {
        console.log('dates dont match');
        return false;
    }
}


/* taken from:
http://stackoverflow.com/questions/492994/compare-two-dates-with-javascript
*/
var dates = {
    convert:function(d) {
        // Converts the date in d to a date-object. The input can be:
        //   a date object: returned without modification
        //  an array      : Interpreted as [year,month,day]. NOTE: month is 0-11.
        //   a number     : Interpreted as number of milliseconds
        //                  since 1 Jan 1970 (a timestamp) 
        //   a string     : Any format supported by the javascript engine, like
        //                  "YYYY/MM/DD", "MM/DD/YYYY", "Jan 31 2009" etc.
        //  an object     : Interpreted as an object with year, month and date
        //                  attributes.  **NOTE** month is 0-11.
        return (
            d.constructor === Date ? d :
            d.constructor === Array ? new Date(d[0],d[1],d[2]) :
            d.constructor === Number ? new Date(d) :
            d.constructor === String ? new Date(d) :
            typeof d === "object" ? new Date(d.year,d.month,d.date) :
            NaN
        );
    },
    compare:function(a,b) {
        // Compare two dates (could be of any type supported by the convert
        // function above) and returns:
        //  -1 : if a < b
        //   0 : if a = b
        //   1 : if a > b
        // NaN : if a or b is an illegal date
        // NOTE: The code inside isFinite does an assignment (=).
        return (
            isFinite(a=this.convert(a).valueOf()) &&
            isFinite(b=this.convert(b).valueOf()) ?
            (a>b)-(a<b) :
            NaN
        );
    },
    inRange:function(d,start,end) {
        // Checks if date in d is between dates in start and end.
        // Returns a boolean or NaN:
        //    true  : if d is between start and end (inclusive)
        //    false : if d is before start or after end
        //    NaN   : if one or more of the dates is illegal.
        // NOTE: The code inside isFinite does an assignment (=).
       return (
            isFinite(d=this.convert(d).valueOf()) &&
            isFinite(start=this.convert(start).valueOf()) &&
            isFinite(end=this.convert(end).valueOf()) ?
            start <= d && d <= end :
            NaN
        );
    }
}