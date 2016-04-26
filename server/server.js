var express = require('express'),
    app = express(),
    bodyparser = require('body-parser'),
    firebase = require('firebase');

var workoutsRef = new Firebase('https://sweat-fitness.firebaseio.com/workouts');
var groupWorkoutsRef = new Firebase('https://sweat-fitness.firebaseio.com/groupWorkouts');
var usersRef = new Firebase('https://sweat-fitness.firebaseio.com/users');

app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.use(bodyparser.json());

app.listen(process.env.PORT || 5000);

app.get('/today/', function(req, res) {
    var uid = req.param('uid');
    console.log('got GET on today with uid: ' + uid);
    groupWorkoutsRef.once("value", function(data) {
        var snapshot = data.val();
        var today = [];
        var groups = [];
        var workoutIDs = [];
        for (var id in snapshot) {
            if (snapshot.hasOwnProperty(id)) {
                var startDT = new Date(snapshot[id]['startDateTime']);
                if (snapshot[id]['ownerUid'] === uid) {
                    continue; // Don't want to see my own ones
                } else if (snapshot[id]['isFull']) {
                    continue; // skip matched ones 
                }
                if (!(dates.areSameDate(startDT, new Date()))) { // check if this is happening today
                    continue;
                }
                var member_id = snapshot[id].memberWorkouts[0];
                groups.push(snapshot[id]);
                workoutIDs.push(member_id);

                /*
                console.log(member_id);
                workoutsRef.child(member_id).once('value', function(data) {
                    console.log(data.val());
                    today.push({
                        'group': snapshot[id],
                        'workout_location': data.val().location,
                        'workout_types': data.val().workout_types
                    });
                });
                */
            }
        }
        todayRespond(groups, workoutIDs, res, []);
    });
});

var todayRespond = function(groups, workoutIDs, res, res_payload) {
    if (groups.length == 0) {
        return res.send(res_payload);
    }

    var group = groups.pop(),
        workoutID = workoutIDs.pop();

    workoutsRef.child(workoutID).once('value', function(data) {
        res_payload.push({
                'group': group,
                'workout_location': data.val().location,
                'workout_types': data.val().workout_types,
        });
        return todayRespond(groups, workoutIDs, res, res_payload);
    });
}



app.get('/confirm/', function(req, res) {

});


// format nice JSON for a new workout group using current request
var generateNewGroup = function(currentReq) {
    return {
        owner: currentReq.ownerUid,
        ownerWorkout: currentReq.myID,
        startDateTime: currentReq.startDateTime,
        endDateTime: currentReq.endDateTime,
        maxPeople: currentReq.maxPeople,
        numPeople: 1,
        matchedUids: [currentReq.ownerUid],
        confirmedUids: [''], // firebase doesn't like storing empty arrays..
        memberWorkouts: [currentReq.myID],
        isFull: false,
    };
}

var getGroupInfo = function(groupIds, infos, res, handle) {
    if (groupIds.length === 0) {
        console.log(res);
        handle.send(res);
        return;
    }

    var info = infos.pop(),
        id = groupIds.pop();


    // 4/16/2016: Issue with certain workouts not having matchedTo and myID on a very rare occasion
    // cannot reproduce; hotfixing for now
    if (id == '') {
        return getGroupInfo(groupIds, infos, res, handle);
    }

    groupWorkoutsRef.child(id).once("value", function(data) {
        var snapshot = data.val();
        if (info.confirmed) {
            res.confirmed.push({
                'matchedTo': snapshot,
                'info': info
            });
        } else if (info.matched) {
            res.pending.push({
                'matchedTo': snapshot,
                'info': info
            });
            console.log(res);
        } else {
            res.requested.push({
                'matchedTo': '', // Do we show this? Technically available
                'info': info
            });
        }
        // recurse 
        // NOTE: this is a MUST because of JS's async behavior
        return getGroupInfo(groupIds, infos, res, handle);
    });
}

app.get('/match/', function(req, res) {
    var uid = req.param('uid');
    console.log('got GET on match with uid: ' + uid);
    workoutsRef.once("value", function(data) {
        var snapshot = data.val();
        var groupIDs = []; // to look up later
        var infos = [];

        for (var id in snapshot) {
            if (snapshot.hasOwnProperty(id)) {
                if (snapshot[id].ownerUid == uid) {
                    groupIDs.push(snapshot[id].matchedTo);
                    infos.push(snapshot[id]);
                }
            }
        }
        getGroupInfo(groupIDs, infos, {
            'confirmed': [],
            'pending': [],
            'requested': [],
        }, res);
    });
});

app.post('/confirm/', function(req, res) {
    var jsonStr = '';

    req.on('data', function(data) {
        jsonStr += data;
    });

    req.on('end', function() {
        currentReq = JSON.parse(jsonStr);
        
        // first update the request
        currentReq.info.confirmed = true;
        updateNewWorkout(workoutsRef, currentReq.info.myID, currentReq.info);

        // update the group next
        currentReq.matchedTo.confirmedUids.push(currentReq.info.ownerUid);
        return updateNewWorkout(groupWorkoutsRef, currentReq.matchedTo.myID, currentReq.matchedTo); 
    });
});

app.post('/', function(req, res) {
    console.log('received post');
    var jsonStr = '';

        req.on('data', function(data) {
            jsonStr += data;
        });

        req.on('end', function() {
            var idToUpdate,
                currentReq = JSON.parse(jsonStr),
                dataToUpdate = {},
                newWorkoutRef = workoutsRef.push(currentReq),
                foundMatchGroup = false;

            // update the key
            currentReq.myID = newWorkoutRef.key();

            groupWorkoutsRef.once("value", function(data) {
                var snapshot = data.val();
                // No group workouts yet
                if (!snapshot) {
                    var group = generateNewGroup(currentReq);
                    groupWorkoutsRef.push(group).then(function(newGroup) {
                        currentReq.matchedTo = newGroup.key();
                        group.myID = newGroup.key();
                        updateNewWorkout(workoutsRef, newWorkoutRef.key(), currentReq);
                        updateNewWorkout(groupWorkoutsRef, newGroup.key(), group);
                        return;
                    });
                } else {
                    for (var id in snapshot) {
                        if (snapshot.hasOwnProperty(id)) {
                            if (isMatch(snapshot[id], currentReq)) {
                                console.log('is a match!');
                                foundMatchGroup = true;

                                // Change the existing workout group info
                                snapshot[id].matchedUids.push(currentReq.ownerUid);
                                snapshot[id].memberWorkouts.push(currentReq.myID);
                                snapshot[id].numPeople = snapshot[id].numPeople + 1
                                if (snapshot[id].numPeople == snapshot[id].maxPeople) {
                                    snapshot[id].isFull = true;
                                }
                                idToUpdate = id;
                                dataToUpdate = snapshot[id];

                                updateNewWorkout(groupWorkoutsRef, id, snapshot[id]);
                                updateExistingWorkout(workoutsRef, snapshot[id].ownerWorkout)
                                // Change currently requested workout's info
                                currentReq.matched = true;
                                currentReq.matchedTo = id;
                                break;
                            }
                        }
                    }

                    // No match, push a new group workout
                    if (!foundMatchGroup) {
                        var group = generateNewGroup(currentReq)
                        groupWorkoutsRef.push(group).then(function(newGroup) {
                            currentReq.matchedTo = newGroup.key();
                            group.myID = newGroup.key();
                            updateNewWorkout(workoutsRef, newWorkoutRef.key(), currentReq);
                            updateNewWorkout(groupWorkoutsRef, newGroup.key(), group);
                        });
                        return;
                    } else {
                        updateNewWorkout(workoutsRef, newWorkoutRef.key(), currentReq);
                    }
                }
            });
        });
});

var updateExistingWorkout = function(ref, id, matchedTo) {
    ref.child(id).update({
        'matched': true
    });
}

var updateNewWorkout = function(ref, id, data) {
    console.log('update New workout on ID:' + id);
    console.log(data);
    ref.child(id).update(
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
    } else if (data['matchedUids'].indexOf(req.ownerUid) !== -1) {
        shouldMatch = false;; // dont wanna add myself again. skip!
    } else if (req['maxPeople'] < data['numPeople'] ) {
        // too many people
        shouldMatch = false;
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

    var groupStartTime = new Date(req['startDateTime']),
        groupEndTime = new Date(req['endDateTime']),
        reqStartTime = new Date(data['startDateTime']),
        reqEndTime = new Date(data['endDateTime']);

    if (dates.inRange(groupStartTime, reqStartTime, reqEndTime)) {
        return true;
    } else if (dates.inRange(reqStartTime, groupStartTime, groupEndTime)) {
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
