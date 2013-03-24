
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

var scope = {scope: ['']};

app.get('/', routes.index);
app.get('/users', user.list);
app.get('/login/facebook/', Facebook.loginRequired(scope), user.fb_login);
app.get('/connect', user.connect);
app.get('/connect/facebook', user.fb_connect);
app.get('/connect/twitter', user.tw_connect);
// app.get('/twitter', user.tw_login);

var twitter = rem.connect('twitter.com').configure({
  key: 'PGOuhd7q3ZFScuswcHSorA',
  secret: 'aUrhiEb02qkeNwsCF7AMkZvCFWs9mbi42wq32q0wj8'
});

var oauth = rem.oauth(twitter, 'http://' + app.get('host') + '/oauth/callback');

app.get('/login/twitter/', oauth.login());

function loginRequired (req, res, next) {
  if (!req.twitter) {
    res.redirect('/');
  } else {
    next();
  }
}

app.use(oauth.middleware(function (req, res, next) {
  console.log("The user is now authenticated.");
  res.redirect('/twitter');
}));

// Save the user session as req.user.
app.all('/*', function (req, res, next) {
  req.twitter = oauth.session(req);
  next();
});

app.listen(app.get('port'), function () {
  console.log('Listening on http://' + app.get('host'))
});

app.get('/twitter', loginRequired, user.tw_login);
