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