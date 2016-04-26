var apiEndpoint = 'http://warm-river-17284.herokuapp.com';

angular.module('starter.controllers')
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
        scope.doRefresh();
    }
}])

