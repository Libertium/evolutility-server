var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./server/routes/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'client/views'));
app.set('view engine', 'jade');
////app.set('view engine', 'html');
/**/
// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, './client', 'public')));

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(err, req, res, next) {
    //var err = new Error('Not Found');
    //err.status = 404;
    //next(err);
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Cesc: To handle the file form submission
// we need the fs module for moving the uploaded files
var fs = require('fs');
var busboy = require('connect-busboy');
app.use(busboy());

app.post('/file-upload', function(req, res) {
    console.log( 'Write to '+__dirname );
    var fstream;
    req.pipe(req.busboy);
    req.busboy.on('file', function (fieldname, file, filename) {
        console.log("Uploading: " + filename);
        //fstream = fs.createWriteStream(__dirname + '/files/' + filename);
        fstream = fs.createWriteStream(__dirname + '/client/public/pix/comics/' + filename);
        file.pipe(fstream);
        fstream.on('close', function () {
           console.log(req);
           //console.log(res);
           console.log(req.body);
           //res.redirect('./');
           //res.redirect(req.get('referer'));
           // res.redirect('./#testCesc/edit/7');
           res.redirect('back');
           // res.send('Hello from D!');

            //res.send('File uploaded to: ' + target_path + ' - ' + req.files.thumbnail.size + ' bytes');
            //console.log('File uploaded to: ' + target_path + ' - ' + req.files.thumbnail.size + ' bytes');
        });
    });
});

/*
app.controller('formCtrl',function($scope,$http){
  $scope.submit = function() {
      $http
          .post('/api/stickies', {what: to, put: here})
          .success(function(data){
              //what to do here
          })
          .error(function(data){
              console.log('Error: ' + data);
          });
  };
});*/

// http://www.hacksparrow.com/handle-file-uploads-in-express-node-js.html
// Cesc:  make sure the files are uploaded to a specific directory
// app.use(express.bodyParser({uploadDir:'./uploads'}));

/*
app.post('/file-upload', function(req, res) {
    console.log(req.body);
     console.log(req.files);
    // get the temporary location of the file
    var tmp_path = req.files.thumbnail.path;
    // set where the file should actually exists - in this case it is in the "images" directory
    var target_path = './public/images/' + req.files.thumbnail.name;
    // move the file from the temporary location to the intended location
    fs.rename(tmp_path, target_path, function(err) {
        if (err) throw err;
        // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
        fs.unlink(tmp_path, function() {
            if (err) throw err;
            //res.send('File uploaded to: ' + target_path + ' - ' + req.files.thumbnail.size + ' bytes');
            console.log('File uploaded to: ' + target_path + ' - ' + req.files.thumbnail.size + ' bytes');
        });
    });
});
*/

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
