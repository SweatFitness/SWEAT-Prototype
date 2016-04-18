angular.module('starter.controllers')
.controller('workoutDetailCtrl', ['$scope', '$state', '$stateParams', 'Workouts', 'Auth', 'UsersList', function($scope, $state, $stateParams, Workouts, Auth, UsersList) {
    $scope.workout = $stateParams.workout;
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
}]);
