
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , Facebook = require('facebook-node-sdk')
  , http = require('http')
  , path = require('path')
  , rem = require('rem');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('2iaodg98heuhpdo09210359adoi'));
  app.use(express.session());
  app.use(Facebook.middleware({appId:'494199227306977', secret: '0ee26ad282f94e0794109910218d946e'}));
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function () {
  app.set('host', 'localhost:' + 3000);
  app.use(express.errorHandler());
});

app.configure('production', function () {
  app.set('host', process.env.HOST);
});

var scope = {scope: ['read_stream']};

app.get('/', Facebook.loginRequired(scope), routes.index);
app.get('/users', Facebook.loginRequired(scope), user.list);
app.get('/login/facebook/', Facebook.loginRequired(scope), user.fb_login);
app.get('/connect', Facebook.loginRequired(scope), user.connect);
app.get('/search/facebook', Facebook.loginRequired(scope), user.fb_search)

app.listen(app.get('port'), function () {
  console.log('Listening on http://' + app.get('host'))
});
