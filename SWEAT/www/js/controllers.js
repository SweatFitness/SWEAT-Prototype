angular.module('starter.controllers', [])

.factory('Auth', function ($firebaseAuth) {
    var usersRef = new Firebase('https://sweat-fitness.firebaseio.com/users');
    return $firebaseAuth(usersRef);
})

.factory('Workouts', ['$firebaseArray', function($firebaseArray) {
    var worktoutsRef = new Firebase('https://sweat-fitness.firebaseio.com/workouts');
    return $firebaseArray(workoutsRef);
}])


.controller('LoginCtrl', function($scope, $location, Auth) {
    $scope.data = {};

    $scope.loginEmail = function(){
        Auth.$authWithPassword({
            email: $scope.data.email,
            password: $scope.data.password
        }).then(function(authData) {
            console.log('Authenticated successfully with payload: ', authData);
            //TODO: redirect to home.html
        }).catch(function(error) {
            console.log('Login failed with error: ', error);
        });
    };
})

.controller('SignupCtrl', function($scope, $location, Auth) {
    $scope.data = {};
    $scope.signupEmail = function() {
        Auth.$createUser({
            email: $scope.data.email,
            password: $scope.data.password,
            firstname: $scope.data.firstname,
            lastname: $scope.data.lastname
        }).then(function(userData) {
            console.log('Successfully created user with uid: ', userData);
            //TODO: authenticate user and recirect to home.html
        }).catch(function(error) {
            console.log('User creation failed with error: ', error);
        });
    };
})
