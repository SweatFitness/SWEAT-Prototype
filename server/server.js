var express = require('express'),
    app = express(),
    bodyparser = require('body-parser'),
    firebase = require('firebase');

var workoutsRef = new Firebase('https://sweat-fitness.firebaseio.com/groupWorkouts');
var usersRef = new Firebase('https://sweat-fitness.firebaseio.com/users');

app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});


app.use(bodyparser.json());

app.listen(process.env.PORT || 8080);

app.get('/today/', function(req, res) {
    var uid = req.param('uid');
    console.log('got GET on today with uid: ' + uid);
    workoutsRef.once("value", function(data) {
        var snapshot = data.val();
        var today = [];
        for (var id in snapshot) {
            if (snapshot.hasOwnProperty(id)) {
                var startDT = new Date(snapshot[id]['startDateTime']);
                if (snapshot[id]['ownerUid'] === uid) {
                    continue; // Don't want to see my own ones
                } else if (snapshot[id]['matched']) {
                    continue; // skip matched ones 
                }

                if (dates.areSameDate(startDT, new Date())) {
                    today.push(snapshot[id]);
                }
            }
        }

        res.send({
            'today': today
        });
    });
});

app.get('/confirm/', function(req, res) {

});

/*
app.get('/forceMatch/', function(req, res) {
    var uid = req.param('uid');
    console.log('got GET on forceMatch with uid: ' + uid);
    workoutRef.once("value", function(data) {
        var snapshot = data.val();
        for (var id in snapshot) {
            if (snapshot.hasOwnProperty(id)) {
                if (snapshot[id][''])
            }
        }
    })
});
*/

app.get('/match/', function(req, res) {
    var uid = req.param('uid');
    console.log('got GET on match with uid: ' + uid);
    workoutsRef.once("value", function(data) {
        var snapshot = data.val();
        var confirmed = [];
        var pending = [];
        var requested = [];
        for (var id in snapshot) {
            if (snapshot.hasOwnProperty(id)) {
                if (snapshot[id]['ownerUid'] === uid) {
                    if (snapshot[id]['confirmed']) {
                        confirmed.push(snapshot[id]);
                    } else if (snapshot[id]['matched']) {
                        pending.push(snapshot[id]);
                    } else {
                        requested.push(snapshot[id]);
                    }
                }
            }
        }
        res.send({
            'confirmed': confirmed,
            'pending': pending,
            'requested': requested,
        });
    });
});

app.post('/', function(req, res) {
    console.log('received post');
    var jsonStr = '';

        req.on('data', function(data) {
            jsonStr += data;
        });

        req.on('end', function() {
            var currentReq = JSON.parse(jsonStr);
            var idToUpdate;
            var dataToUpdate = {};

            workoutsRef.once("value", function(data) {
                var snapshot = data.val();
                for (var id in snapshot) {
                    if (snapshot.hasOwnProperty(id)) {
                        if (isMatch(snapshot[id], currentReq)) {
                            currentReq['matched'] = true;
                            snapshot[id]['matched'] = true;
                            currentReq['matchedWith'] = id;
                            snapshot[id]['members'].append(currentReq['ownerUid']);
                            currentReq['partnerUid'] = snapshot[id]['ownerUid'];
                            snapshot[id]['partnerUid'] = currentReq['ownerUid'];
                            idToUpdate = id;
                            dataToUpdate = snapshot[id];
                            break;
                        }
                    }
                }
                
                var newWorkoutRef = workoutsRef.push(currentReq);

                currentReq['myID'] = newWorkoutRef.key();
                updateWorkout(newWorkoutRef.key(), currentReq);
                
                if (currentReq['matched']) {
                    console.log('logging current one');

                    var newKey = newWorkoutRef.key();
                    console.log('updating id: ' + idToUpdate);
                    console.log('key is ' + newKey);
                    dataToUpdate['matchedWith'] = newKey;
                    updateWorkout(idToUpdate, dataToUpdate);
                }
            });
        });
});

var updateWorkout = function(id, data) {
    workoutsRef.child(id).update(
        data
    );
}

var saveWorkoutToFirebase = function(data) {
    workoutsRef.set(data);
}

var isMatch = function(data, req) {
    console.log('Checking match...');
    var shouldMatch = true;
    if (data['isFull']) {  // already matched. skip!
        shouldMatch = false;
    } else if (data['confirmed']) {
        shouldMatch = false; // already confirmed. skip!
    } else if (data['ownerUid'] === req['ownerUid']) {
        shouldMatch = false;; // dont wanna match myself. skip!
    }
    

    /* defer experts on group for now
    if (data['matchType'] === 'expert') {
        // expert is not set
        if (data['expert'] !== '') {
            // 
            if (req['lookingfor'] === 'Trainee') {
                shouldMatch = false;
            } else {
                shouldMatch = true;
            }
        } else {

        }
    }
   */

    // both looking for buddies. match
    if (data['lookingfor'] === 'Workout Buddy' && req['lookingfor'] === 'Workout Buddy') {
        shouldMatch = true;
    } else if (data['matchType'] == 'expert' && req['lookingfor'] == 'Expert') {
        shouldMatch = false;
    } else if (data['lookingfor'] === 'Expert/Trainer' && req['lookingfor'] !== 'Trainee') {
        shouldMatch = false;
    } else if (data['lookingfor'] !== 'Trainee' && req['lookingfor'] === 'Expert/Trainer') {
        shouldMatch = false;
    } else if (data['lookingfor'] === 'Trainee' && req['lookingfor'] !== 'Expert/Trainer') {
        shouldMatch = false;
    } else if (data['lookingfor'] !== 'Expert/Trainer' && req['lookingfor'] === 'Trainee') {
        shouldMatch = false;
    }

    if (shouldMatch === false) {
        return false;
    }

    var firstGuyStartTime = new Date(req['startDateTime']),
        firstGuyEndTime = new Date(req['endDateTime']),
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
    areSameDate: function(d1, d2) {
        return d1.getFullYear() == d2.getFullYear()
            && d1.getMonth() == d2.getMonth() 
            && d1.getDate() == d2.getDate();
    },

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
