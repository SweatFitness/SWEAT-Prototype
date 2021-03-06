angular.module('starter.controllers')
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
        $http({
            method: 'POST',
            url: apiEndpoint + '/confirm/',
            data: workout,
            headers: {'Content-Type': 'applications/x-www-form-urlencoded'}
        });
        $scope.doRefresh();
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
        console.log(workout.myID);
        Workouts.$remove(Workouts.$getRecord(workout.myID));
        $scope.doRefresh();
    }

    $scope.showDetail = function(workout) {
        console.log('show detail');
        $state.go('tab.match.workoutDetail');
    }
}])

