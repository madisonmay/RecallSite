
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
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
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function () {
  app.set('host', process.env.HOST);
  app.use(express.errorHandler());
});

app.configure('production', function () {
  app.set('host', process.env.HOST);
});

var scope = {scope: ['read_stream']};

/**
 * Setup Twitter and Facebook
 */

var twitter = rem.connect('twitter.com').configure({
  key: 'vsItuzcxhJUP3jMqOL0Q',
  secret: 'ZGh3GeRe8x2m4GvqW1Rm7opuAGQSPpYNk5g6nL9ZTE'
});

var facebook = rem.connect('facebook.com').configure({
  key: '494199227306977',
  secret: '0ee26ad282f94e0794109910218d946e'
});

var tw_oauth = rem.oauth(twitter, 'http://' + app.get('host') + '/oauth/twitter');
var fb_oauth = rem.oauth(facebook, 'http://' + app.get('host') + '/oauth/facebook');

app.get('/login/twitter/', tw_oauth.login());
app.get('/login/facebook/', fb_oauth.login());
app.get('/connect/twitter/', tw_oauth.login());
app.get('/connect/facebook/', fb_oauth.login());


//should add support for more than two social media outlets eventually
app.use(tw_oauth.middleware(function (req, res, next) {
  console.log("The user is now authenticated.");
  if (!req.session.user) {
    res.redirect('/twitter');
  } else {
    console.log('Connect facebook.');
    res.redirect('/tw_connect');
  }
}));

//should add support for more than two social media outlets eventually
app.use(fb_oauth.middleware(function (req, res, next) {
  console.log("The user is now authenticated.");
  if (!req.session.user) {
    res.redirect('/facebook');
  } else {
    console.log('Connect twitter.');
    res.redirect('/fb_connect');
  }
}));


// Save the user session as req.user.
app.all('/*', function (req, res, next) {
  req.twitter = tw_oauth.session(req);
  req.facebook = fb_oauth.session(req);
  console.log('app.all - req.facebook: ', req.facebook)
  console.log('app.all - req.twitter: ', req.twitter)
  next();
});


/**
 * Routes
 */

function loginRequired (req, res, next) {
  if (!req.twitter && !req.facebook) {
    console.log('User must log in');
    res.redirect('/');
  } else {
    console.log('Facebook: ', req.facebook);
    console.log('Twitter: ', req.twitter);
    next();
  }
}

app.get('/twitter', loginRequired, user.tw_login);

app.get('/facebook', loginRequired, user.fb_login);

app.get('/', routes.index);
app.get('/users', user.list);
app.get('/connect', loginRequired, user.connect);
app.get('/search', loginRequired, user.search);
app.get('/fb_connect', loginRequired, user.fb_connect);
app.get('/tw_connect', loginRequired, user.tw_connect);


app.listen(app.get('port'), function () {
  console.log('Listening on http://' + app.get('host'))
});



