var apiEndpoint = 'http://127.0.0.1:8080';
//var apiEndpoint = 'http://warm-river-17284.herokuapp.com';

angular.module('starter.controllers')
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
