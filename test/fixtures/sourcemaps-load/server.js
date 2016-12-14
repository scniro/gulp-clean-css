var express = require('express');
var app = express();

app.set('port', 2000);

app.use('/', express.static(__dirname))

app.get('/', function(req,res) {
  res.sendfile('index.html');
});

var server = app.listen(app.get('port'), function() {
  var port = server.address().port;
  console.log(`Magic happens on port ${port}`);
});