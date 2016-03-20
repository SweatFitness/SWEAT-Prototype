angular.module('starter.controllers', [])

.factory('Auth', function ($firebaseAuth) {
    var usersRef = new Firebase('https://sweat-fitness.firebaseio.com/users');
    return $firebaseAuth(usersRef);
})

.factory('Workouts', ['$firebaseArray', function($firebaseArray) {
    var workoutsRef = new Firebase('https://sweat-fitness.firebaseio.com/workouts');
    return $firebaseArray(workoutsRef);
}])


.controller('LoginCtrl', function($scope, $state, Auth) {
    $scope.data = {};

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
            password: $scope.data.password,
            firstname: $scope.data.firstname,
            lastname: $scope.data.lastname
        }).then(function(userData) {
            console.log('Successfully created user with uid: ', userData);
            $scope.loginEmail();
        }).catch(function(error) {
            console.log('User creation failed with error: ', error);
        });
    };
    $scope.cancelSignup = function() {
        $ionicHistory.goBack();
    }
})

.controller('MatchCtrl', function($scope, $state, Workouts) {
    $scope.Workouts = Workouts;
    //TODO: divide workouts into confirmed and pending
    $scope.confirmedWorkouts = [0,1,2];
    $scope.pendingWorkouts = [0,1,2];
})
