// For deployment: var apiEndpoint = 'http://warm-river-17284.herokuapp.com/';
var apiEndpoint = 'http://127.0.0.1:8080';
//var apiEndpoint = 'http://warm-river-17284.herokuapp.com';

angular.module('starter.controllers', [])

.factory('Auth', ['$firebaseAuth', function ($firebaseAuth) {
    var usersRef = new Firebase('https://sweat-fitness.firebaseio.com/users');
    return $firebaseAuth(usersRef);
}])

.factory('UsersList', ['$firebaseArray', function($firebaseArray) {
    var usersRef = new Firebase('https://sweat-fitness.firebaseio.com/users');
    return $firebaseArray(usersRef);
}])

.factory('Workouts', ['$firebaseArray', function($firebaseArray) {
    var workoutsRef = new Firebase('https://sweat-fitness.firebaseio.com/workouts');
    return $firebaseArray(workoutsRef);
}])


.controller('LoginCtrl', ['$scope', '$state', 'Auth', 'UsersList', function($scope, $state, Auth, UsersList) {
    $scope.data = {};
    $scope.usersRef = new Firebase('https://sweat-fitness.firebaseio.com/users');

    $scope.loginEmail = function(){
        Auth.$authWithPassword({
            email: $scope.data.email,
            password: $scope.data.password
        }).then(function(authData) {
            console.log('Authenticated successfully with payload: ', authData);
            $state.go('tab');
        }).catch(function(error) {
            console.log('Login failed with error: ', error);
        });
    };

    $scope.signupEmail = function() {
        Auth.$createUser({
            email: $scope.data.email,
            password: $scope.data.password
        }).then(function(userData) {
            console.log('Successfully created user with uid: ', userData);
            $scope.usersRef.child(userData.uid).set({
                provider: 'password',
                firstname: $scope.data.firstname,
                lastname: $scope.data.lastname
            });
            $scope.loginEmail();
        }).catch(function(error) {
            console.log('User creation failed with error: ', error);
        });
    };
    $scope.cancelSignup = function() {
        $ionicHistory.goBack();
    }
}])

.controller('TodayCtrl', ['$http', '$scope', '$state', '$ionicListDelegate', 'Auth', 'Workouts', 'UsersList', function($http, $scope, $state, $ionicListDelegate, Auth, Workouts, UsersList) {
    $scope.doRefresh = function() {
        $http({
            method: 'GET',
            url: apiEndpoint + '/today/',
            params: {'uid': Auth.$getAuth().uid}
        }).then(function(response) {
            var workouts = response.data
            console.log(workouts);
            $scope.todaysWorkouts = workouts.today;
        }, function(error) {
            //TODO: error
        }).finally(function() {
            $scope.$broadcast('scroll.refreshComplete');
        });
    }
    $scope.doRefresh();

    $scope.getUserName = function(uid) {
        return UsersList.$getRecord(uid).firstname + " " + UsersList.$getRecord(uid).lastname;
    }
    $scope.getDateFrom = function(dateString) {
        var date = new Date(dateString);
        return date.toLocaleDateString();
    }
    $scope.getTimeFrom = function(dateString) {
        var date = new Date(dateString);
        return date.toLocaleTimeString();
    }
    $scope.getWorkout = function(id) {
        return Workouts.$getRecord(id);
    }
    $scope.listCanSwipe = function() {
        $ionicListDelegate.canSwipeItems(true);
    }
    $scope.confirmWorkout = function(workout) {
        console.log(workout.myID);
        var workoutRef = new Firebase('https://sweat-fitness.firebaseio.com/workouts/' + workout.myID);     
        var partnerWorkoutRef = new Firebase('https://sweat-fitness.firebaseio.com/workouts/' + workout.matchedWith);
        partnerWorkoutRef.child('confirmed').set(true);
        workoutRef.child('confirmed').set(true);
        partnerWorkoutRef.child('matchedWith').set(workout.myID);
        workoutRef.child('matchedWith').set(partnerWorkoutRef.child('myID'));
        $ionicListDelegate.closeOptionButtons();      
        scope.doRefresh();
    }
}])

.controller('MatchCtrl', ['$http', '$scope','$state', '$ionicListDelegate', 'Workouts', 'Auth', 'UsersList', function($http, $scope, $state, $ionicListDelegate, Workouts, Auth, UsersList) {
    $scope.UsersList = UsersList;
    $scope.confirmedWorkouts = [];
    $scope.pendingWorkouts = [];
    $scope.requestedWorkouts = [];

    $scope.getUserName = function(uid) {
        return UsersList.$getRecord(uid).firstname + " " + UsersList.$getRecord(uid).lastname;
    }
    $scope.getDateFrom = function(dateString) {
        var date = new Date(dateString);
        return date.toLocaleDateString();
    }
    $scope.getTimeFrom = function(dateString) {
        var date = new Date(dateString);
        return date.toLocaleTimeString();
    }
    $scope.getWorkout = function(id) {
        return Workouts.$getRecord(id);
    }

    $scope.doRefresh = function() {
        console.log('Refereshing!');
        $http({
            method: 'GET',
            url: apiEndpoint + '/match/',
            params: {'uid': Auth.$getAuth().uid}
        }).then(function(response) {
            var workouts = response.data
            console.log(workouts);
            $scope.confirmedWorkouts = workouts.confirmed;
            $scope.pendingWorkouts = workouts.pending;
            $scope.requestedWorkouts = workouts.requested;
        }, function(error) {
            //TODO: error
        }).finally(function() {
            $scope.$broadcast('scroll.refreshComplete');
        });
    }
    $scope.doRefresh();

    $scope.listCanSwipe = function() {
        $ionicListDelegate.canSwipeItems(true);
    }

    $scope.confirmWorkout = function(workout) {
        console.log(workout.myID);
        var workoutRef = new Firebase('https://sweat-fitness.firebaseio.com/workouts/' + workout.myID);     
        var partnerWorkoutRef = new Firebase('https://sweat-fitness.firebaseio.com/workouts/' + workout.matchedWith);
        partnerWorkoutRef.child('confirmed').set(true);
        workoutRef.child('confirmed').set(true);      
        $ionicListDelegate.closeOptionButtons();      
        scope.doRefresh();
    }

    $scope.declineWorkout = function(workout) {
        var myWorkoutRef = new Firebase('https://sweat-fitness.firebaseio.com/workouts/' + workout.myID);       
        var partnerWorkoutRef = new Firebase('https://sweat-fitness.firebaseio.com/workouts/' + workout.matchedWith);     
        myWorkoutRef.child('confirmed').set(false);       
        myWorkoutRef.child('matchedWith').set('');        
        myWorkoutRef.child('matched').set(false);     
        myWorkoutRef.child('partnerUid').set('');     
        partnerWorkoutRef.child('confirmed').set(false);      
        partnerWorkoutRef.child('matchedWith').set('');       
        partnerWorkoutRef.child('matched').set(false);        
        partnerWorkoutRef.child('partnerUid').set('');        
        $scope.doRefresh();
    }

    $scope.deleteWorkout = function(workout) {
        console.log('delete');
        Workouts.$remove(Workouts.$getRecord(workout.myID));
        $scope.doRefresh();
    }
}])

.controller('ScheduleCtrl', ['$http', '$scope', '$state', '$ionicPopup', '$ionicPopover', 'Auth', 'Workouts', function($http, $scope, $state, $ionicPopup, $ionicPopover, Auth, Workouts) {
    // local variables, functions
    var __makeDateTime = function(date, time) {
        // time in the day in seconds
        var hours = parseInt(time/3600);
        var mins = parseInt((time - hours*3600)/60);
        return new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate(),
                hours, 
                mins,
                0, 0);
    }
    var __now = new Date();

    $scope.data = {};
    $scope.data.selectedDate = __now;
    $scope.data.selectedDay = __now.getDay();
    $scope.data.today = __now.getDay(); // constant, DO NOT CHANGE
    $scope.data.startTimepickerObj = {
        inputEpochTime: (__now.getHours() + 1) * 60 * 60,  //Optional
        step: 15,  //Optional
        format: 12,  //Optional
        titleLabel: 'Start Time',  //Optional
        setLabel: 'Set',  //Optional
        closeLabel: 'Close',  //Optional
        setButtonType: 'button-positive',  //Optional
        closeButtonType: 'button-stable',  //Optional
        callback: function (val) {    //Mandatory
            if (val) {
                this.inputEpochTime = val;
                $scope.data.startTime = val;
                $scope.data.startDateTime = __makeDateTime($scope.data.selectedDate, $scope.data.startTime);
            }
        }
    };
    $scope.data.startTime = $scope.data.startTimepickerObj.inputEpochTime;
    $scope.data.startDateTime = __makeDateTime(__now, $scope.data.startTime);

    $scope.data.endTimepickerObj = {
        inputEpochTime: (__now.getHours() + 2) * 60 * 60,  //Optional
        step: 15,  //Optional
        format: 12,  //Optional
        titleLabel: 'Start Time',  //Optional
        setLabel: 'Set',  //Optional
        closeLabel: 'Close',  //Optional
        setButtonType: 'button-positive',  //Optional
        closeButtonType: 'button-stable',  //Optional
        callback: function (val) {    //Mandatory
            if (val) {
                this.inputEpochTime = val;
                $scope.data.endTime = val;
                $scope.data.endDateTime = __makeDateTime($scope.data.selectedDate, $scope.data.endTime);
            }
        }
    };
    $scope.data.endTime = $scope.data.endTimepickerObj.inputEpochTime;
    $scope.data.endDateTime = __makeDateTime(__now, $scope.data.endTime);

    $scope.createWorkout = function() {
        var req = {
            workout_type: $scope.data.workout_type,
            location: $scope.data.location,
            lookingfor: $scope.data.lookingfor,
            startDateTime: $scope.data.startDateTime.toJSON(),
            endDateTime: $scope.data.endDateTime.toJSON(),
            ownerUid: Auth.$getAuth().uid,
            partnerUid: '',
            matchedWith: '',
            matched: false,
            confirmed: false,
            myID: ''
        };
        console.log('Creating workout: ' +  JSON.stringify(req));
        $http({
                  method  : 'POST',
                  url     : apiEndpoint,
                  data    : req,
                  headers : {'Content-Type': 'application/x-www-form-urlencoded'} 
                 });


        //Workouts.$add(req);
    };

    $scope.dateStringNoYear = function(date) {
        var components = date.toLocaleDateString().split('/');
        return components[0]+'/'+components[1];
    }

    $ionicPopover.fromTemplateUrl('date-popover.html', {
        scope: $scope
    }).then(function(popover) {
        $scope.popover = popover
    });

    $scope.showPopover = function($event) {
        $scope.popover.show($event);
    }

    $scope.hidePopover = function() {
        $scope.popover.hide();
    }

    $scope.$on('$destroy', function() {
        $scope.popover.remove();
    });

    $scope.setDay = function(day, $event) {
        $scope.data.selectedDay = day;
        var dateDiff = day - __now.getDay();
        dateDiff = (dateDiff < 0) ? dateDiff + 7 : dateDiff;
        $scope.data.selectedDate = new Date(__now.getTime() + dateDiff*24*60*60*1000);
        $scope.data.startDateTime = __makeDateTime($scope.data.selectedDate, $scope.data.startTime);
        $scope.data.endDateTime = __makeDateTime($scope.data.selectedDate, $scope.data.endTime);
        $scope.showPopover($event);
        setTimeout(function() {
            $scope.hidePopover();
        },1000);
    }
}]);
