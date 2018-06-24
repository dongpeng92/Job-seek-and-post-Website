var express = require('express'),
    app = express();
var bodyParser = require('body-parser');
var cors = require('cors');

var mongoose = require('mongoose');
mongoose.Promise = require('q').Promise;

mongoose.connect('mongodb://localhost:27017/jobseek');
var db = mongoose.connection;
db.on('error', function () {
    console.log("Error happens!!");
});
db.on('open', function () {
    console.log("Connection established!!!");
});

app.listen(3000, function () {
    console.log("Server running @ localhost:3000")
});

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var user_schema = mongoose.Schema({
    username: String,
    password: String,
    email: String,
    location: String,
    phone: String,
    type: String,
    isLoggedin: Boolean,
    applied: Array,
    saved: Array
});
var user_model = mongoose.model('users', user_schema);

var job_schema = mongoose.Schema({
    title: String,
    desc: String,
    keywords: String,
    location: String,
});
var job_model = mongoose.model('jobs', job_schema);

app.post('/postuser', function (req, res) {
    console.log(req.body);
    var new_user = user_model(req.body);
    new_user.save(function (err) {
        if (!err) {
            console.log("data save!");
            res.send({
                flg: true
            });
        }
    });
});

app.get('/finduser', function (req, res) {
    user_model.find({"username": req.query.username, "password": req.query.password}, function (err, docs) {
        if (!err) {
            console.log(docs);
            console.log(req.query.username);
            console.log(req.query.password);
            var myquery = { username: req.query.username };
            var newvalues = { $set: { isLoggedin: true } };
            user_model.update(myquery, newvalues, function (err, raw) {
                console.log(raw);
                console.log("updated!!")
            });
            docs[0].isLoggedin = true;
            console.log(docs);
            res.send(docs);
        }
    });
});

app.get('/checkStatus', function (req, res) {
    var myquery = {"isLoggedin": true };
    user_model.find(myquery, function (err, docs) {
        if(!err) {
            console.log("find user");
            console.log(docs);
            res.send(docs);
        }
    });
});

app.get('/deleteFlag', function (req, res) {
    user_model.update({"_id": req.query.id}, { "isLoggedin": false }, function (err, raw) {
        console.log("updated flag!!");
        res.send({
            isLoggedin: false
        });
    });
});

app.post('/postjob', function (req, res) {
    console.log(req.body);
    var new_job = job_model(req.body);
    new_job.save(function (err) {
        if (!err) {
            console.log("job save!");
            res.send({
                flg: true
            });
        }
    });
});

app.get('/searchjob', function (req, res) {
    var query = {};
    query[req.query.key] = req.query.content;
    console.log(query);
    job_model.find(query, function (err, docs) {
        if (!err) {
            console.log("jobs find!");
            console.log(docs);
            res.send(docs);
        }
    });
});

app.post('/apply', function (req, res) {
    console.log(req.body);
    console.log(req.query.uid);
    user_model.update({"_id": req.query.uid}, {$set: req.body}, function (err, raw) {
        res.send(raw);
    });
});

app.post('/mark', function (req, res) {
    console.log(req.body);
    console.log(req.query.uid);
    console.log({"_id": req.query.id});
    user_model.update({"_id": req.query.uid}, {$set: req.body}, function (err, raw) {
        res.send("Saved");
    });
});

app.get('/pairjob', function (req, res) {
    console.log(req.query.id);
    job_model.findById(req.query.id, function (err, job) {
        if (!err) {
            console.log(job);
            res.send(job);
        }
    });
});
