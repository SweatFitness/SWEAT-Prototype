angular.module('starter.controllers')
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
    };
}]);

