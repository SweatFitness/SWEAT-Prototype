angular.module('starter.controllers', [])

.factory('Auth', function ($firebaseAuth) {
    var usersRef = new Firebase('https://sweat-fitness.firebaseio.com/users');
    return $firebaseAuth(usersRef);
})

.factory('Workouts', ['$firebaseArray', function($firebaseArray) {
    var worktoutsRef = new Firebase('https://sweat-fitness.firebaseio.com/workouts');
    return $firebaseArray(workoutsRef);
}])


.controller('LoginCtrl', function($scope, $state) {
    $scope.data = {};

    $scope.loginEmail = function(){
        console.log($scope.data.email);
    };
})

.controller('SignupCtrl', function($scope, $state) {
    $scope.data = {};
    $scope.signupEmail = function() {
        
    };
})
