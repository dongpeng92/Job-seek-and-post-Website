var app = angular.module('myapp', ['ngRoute']);

app.config(function ($routeProvider) {
    $routeProvider.when('/', {
        templateUrl: 'home.html',
        controller: 'homeController',
        resolve: ['authService', function (authService) {
            return authService.checkUserStatus();
        }]
    })
        .when('/login', {
            templateUrl: 'login.html',
            controller: 'loginController'
        })
        .when('/register', {
            templateUrl: 'register.html',
            controller: 'registerController'
        })
        .when('/post', {
            templateUrl: 'post.html',
            controller: 'postController',
            resolve: ['authService', function (authService) {
                return authService.checkUserStatus();
            }]
        })
        .when('/search', {
            templateUrl: 'search.html',
            controller: 'searchController',
            resolve: ['authService', function (authService) {
                return authService.checkUserStatus();
            }]
        })
        .when('/logout', {
            template: `<h3>Loging out...</h3>`,
            // controller: 'logoutController',
            resolve: ['authService', function (authService) {
                return authService.logout();
            }]
        })
        .otherwise({
            redirectTo: '/'
        })
});

app.controller('homeController', function ($scope, $rootScope) {
    if ($rootScope.user.type == "company") {
        $scope.pageTitle = "Company Home -- Post Job"
    } else {
        $scope.pageTitle = "Job Seeker Home -- Search Job"
    }
});

app.controller('registerController', function ($scope, $http, $location) {
    $scope.signup = function () {
        console.log($scope.authform)
        $http.post('http://localhost:3000/postuser', $scope.authform)
            .then(function (resp) {
                if(resp.data.flg) {
                    alert("Data saved!!");
                    $location.path('/login');
                }
            })
    }
});

app.controller('loginController', function ($scope, $location, $http) {
    $scope.login = function () {
        console.log($scope.auth);
        $http.get(`http://localhost:3000/finduser?username=${$scope.auth.username}&password=${$scope.auth.password}`)
            .then(function (resp) {
                if(resp.data) {
                    alert("Login Success");
                    $location.path('/');
                }
            })
    };
    $scope.signup = function () {
        $location.path('/register');
    };
});

app.factory('authService', function ($q, $http, $rootScope, $location) {
    return {
        'checkUserStatus': function () {
            var defer = $q.defer();
            $http.get(`http://localhost:3000/checkStatus`)
                .then(function (resp) {
                    // console.log(resp.data);
                    if(resp.data.length > 0) {
                        console.log("Logged in");
                        document.getElementById('nav').style.display='block';
                        $rootScope.user = resp.data[0];
                        $rootScope.check = "job_seeker";
                        $rootScope.flg = ($rootScope.user.type.toString() == $rootScope.check) ? true : false;
                        console.log($rootScope.flg);
                        console.log($rootScope.user);
                        defer.resolve();
                    } else {
                        $location.path('/login');
                        defer.reject();
                    }
                });
            return defer.promise;
        },
        'logout': function () {
            console.log($rootScope.user);
            $http.get(`http://localhost:3000/deleteFlag?id=${$rootScope.user._id}`)
                .then(function (resp) {
                    if(!resp.data.isLoggedin){
                        alert('Please Login!');
                        document.getElementById('nav').style.display='none';
                        $location.path('/');
                    }
                });
            localStorage.removeItem("job_list");
        }
    }
});

app.controller('postController', function ($scope, $http, $window) {
    $scope.post = function () {
        console.log($scope.jobform);
        $http.post('http://localhost:3000/postjob', $scope.jobform)
            .then(function (resp) {
                if(resp.data.flg) {
                    alert("Job saved!!");
                    $window.location.reload();
                }
            })
    }
});

app.controller('searchController', function ($scope, $http, $rootScope) {
    if(localStorage.job_list){
        $scope.job_list = JSON.parse(localStorage.job_list);
    }
    $scope.search = function () {
        console.log($scope.searchform);
        $http.get(`http://localhost:3000/searchjob?key=${$scope.searchform.key}&content=${$scope.searchform.content}`)
            .then(function (resp) {
                localStorage.setItem("job_list", JSON.stringify(resp.data));
                $scope.job_list = JSON.parse(localStorage.job_list);
                for (var i = 0; i < $scope.job_list.length; i++){
                    if($rootScope.user.applied.includes($scope.job_list[i]._id)) {
                        $scope.job_list[i].applied=true;
                    } else {
                        $scope.job_list[i].applied=false;
                    }
                    if ($rootScope.user.saved.includes($scope.job_list[i]._id)) {
                        $scope.job_list[i].saved=true;
                    } else {
                        $scope.job_list[i].saved=false;
                    }
                }
            })
    };
    if(localStorage.job_list) {
        console.log($scope.job_list);
        for (var i = 0; i < $scope.job_list.length; i++){
            if($rootScope.user.applied.includes($scope.job_list[i]._id)) {
                $scope.job_list[i].applied=true;
            } else {
                $scope.job_list[i].applied=false;
            }
            if ($rootScope.user.saved.includes($scope.job_list[i]._id)) {
                $scope.job_list[i].saved=true;
            } else {
                $scope.job_list[i].saved=false;
            }
        }
    }
    $scope.apply = function (id) {
        console.log(id);
        $scope.applied = $scope.user.applied ? $scope.user.applied : [];
        $scope.applied.push(id);
        console.log($scope.applied);
        $scope.applied_msg = {
            "applied": $scope.applied
        };
        $http.post(`http://localhost:3000/apply?uid=${$rootScope.user._id}`, $scope.applied_msg)
            .then(function (resp) {
                console.log(resp.data);
                document.getElementById("apply_"+id).disabled=true;
                $http.get(`http://localhost:3000/pairjob?id=${id}`)
                    .then(function (resp) {
                        $scope.applied_jobs = $scope.applied_jobs ? $scope.applied_jobs : [];
                        $scope.applied_jobs.push(resp.data);
                    })
            })
    };
    $scope.mark = function (id) {
        console.log(id);
        $rootScope.id = id;
        $scope.saved = $scope.user.saved ? $scope.user.saved : [];
        $scope.saved.push(id);
        console.log($scope.saved);
        $scope.saved_msg = {
            "saved": $scope.saved
        };
        $http.post(`http://localhost:3000/apply?uid=${$rootScope.user._id}`, $scope.saved_msg)
            .then(function (resp) {
                console.log(resp);
                document.getElementById("mark_" + id).disabled=true;
                $http.get(`http://localhost:3000/pairjob?id=${id}`)
                    .then(function (resp) {
                        $scope.saved_jobs = $scope.saved_jobs ? $scope.saved_jobs : [];
                        $scope.saved_jobs.push(resp.data);
                    })
            })
    };
    for (var i = 0; i < $rootScope.user.applied.length; i++) {
        $http.get(`http://localhost:3000/pairjob?id=${$rootScope.user.applied[i]}`)
            .then(function (resp) {
                $scope.applied_jobs = $scope.applied_jobs ? $scope.applied_jobs : [];
                $scope.applied_jobs.push(resp.data);
            })
    }
    for (var i = 0; i < $rootScope.user.saved.length; i++) {
        $http.get(`http://localhost:3000/pairjob?id=${$rootScope.user.saved[i]}`)
            .then(function (resp) {
                $scope.saved_jobs = $scope.saved_jobs ? $scope.saved_jobs : [];
                $scope.saved_jobs.push(resp.data);
            })
    }
});
