
/*
 * GET users listing.
 */
var Models = require('../models.js');
var User = Models.User;

String.prototype.contains = function(it) { return this.toLowerCase().indexOf(it.toLowerCase()) != -1; };

exports.list = function(req, res){
  res.send("respond with a resource");
};

exports.fb_login = function(req, res){
    //Handles facebook authentication
    console.log("Logged in")
    req.facebook('/me').get(function(err, user) {
        if (err) {
            console.log(err)
        } else {
            User.findOne({fb_id : user.id}).exec(function(err, db_user) {

                //User in database
                if (db_user) {
                    req.session.user = db_user;
                    res.redirect('/connect');
                    // get_friends(db_user.fb_id, db_user._id, req, res, function(friend_list){
                    //     db_user.friend_list = friend_list;
                    //     db_user.save();
                    //
                    // });
                }

                //User DNE
                else if (!db_user || !db_user.length) {
                    var new_user = new User({fb_id: user.id, first_name: user.first_name,
                                             last_name: user.last_name, full_name: user.first_name + ' ' + user.last_name});
                    new_user.save(function(err) {
                        if(err) {
                            console.log("Error: ", err);
                        } else {
                            req.session.user = new_user;
                            console.log("User saved.");
                            res.redirect('/connect');
                        }
                    });
                }

                //Something else unexpected happens
                else {
                    res.send("Recall is currently experiencing issues.");
                }
            });
        }
    });
};

exports.tw_login = function(req, res){
    //Handles twitter authentication
    console.log("Logged in")
    req.twitter('account/verify_credentials').get(function(err, user) {
        console.log("Request to Twitter Completed")
        console.log(user);
        console.log("User: ", user.name)
        if (err) {
            console.log(err)
        } else {
            User.findOne({tw_id : user.id}).exec(function(err, db_user) {

                //User in database
                if (db_user) {
                    req.session.user = db_user;
                    res.redirect('/connect');
                    // get_friends(db_user.fb_id, db_user._id, req, res, function(friend_list){
                    //     db_user.friend_list = friend_list;
                    //     db_user.save();
                    //
                    // });
                }

                //User DNE
                else if (!db_user || !db_user.length) {
                    var new_user = new User({tw_id: user.id, first_name: user.name.split(" ")[0],
                                             last_name: user.name.split(" ")[1], full_name: user.name});
                    new_user.save(function(err) {
                        if(err) {
                            console.log("Error: ", err);
                        } else {
                            req.session.user = new_user;
                            console.log("User saved.");
                            res.redirect('/connect');
                        }
                    });
                }

                //Something else unexpected happens
                else {
                    res.send("Recall is currently experiencing issues.");
                }
            });
        }
    });
};

exports.connect = function(req, res) {
    console.log(req.session.user);
    res.render('connect', {'title': 'Connect', 'user': req.session.user});
}

exports.fb_connect = function(req, res) {
    //Log in with a second account
    req.facebook('/me').get(function(err, user) {
        if (err) {
            console.log(err)
        } else {

            User.update({_id : req.session.user._id}, {fb_id: user.id}, function(err, db_user) {
                //User in database
                if (!err) {
                    console.log('User id: ', user.id)
                    req.session.user = db_user;
                    res.redirect('/connect')
                }

                //Something else unexpected happens
                else {
                    res.send("Something unexpected happened.  We should probably fix it.");
                }
            });
        }
    });
}

exports.tw_connect = function(req, res) {
    //Log in with a second account
    req.twitter('account/verify_credentials').get(function(err, user) {
        if (err) {
            console.log(err)
        } else {
            User.update({_id : req.session.user._id}, {tw_id: user.id}, function(err, db_user) {

                //User in database
                if (!err) {
                    console.log('User id: ', user.id)
                    req.session.user = db_user;
                    res.redirect('/connect');
                }

                //Something else unexpected happens
                else {
                    res.send("Something unexpected happened.  We should probably fix it.");
                }
            });
        }
    });
}

function selectiveAdd(post, data, i, field, content, query) {

    //handling for plurals
    if (String(content).toLowerCase().contains(query)) {
        post[field] = content;
    } else if (query.slice(l-2, l) == 'es') {
        if (String(content).toLowerCase().contains(query.slice(0, l-2))) {
            post[field] = content;
        }
    } else if (query[l-1] == 's') {
        if (String(content).toLowerCase().contains(query.slice(0, l-1))) {
            post[field] = content;
        }
    } else {
        post[field] = '';
    }
    return post
}

exports.fb_search = function(req, res) {
    console.log('req.facebook: ', req.facebook)
    var url = '/me/home?q=' + req.query.q;
    req.facebook(url).get(function(err, data) {

        //processing statuses and comments
        var filtered = []
        data = data.data
        for (var i=0; i<data.length; i++) {
            if (!('category' in data[i].from)){
                filtered.push({});
                var len = filtered.length;
                var post = filtered[len-1];
                post['post_id'] = data[i].id
                post['type'] = 'facebook';
                post['uid'] = data[i].from.id;
                post['username'] = data[i].from.name;
                l = req.query.q.length;
                post = selectiveAdd(post, data, i, 'message', data[i].message, req.query.q);
                if ('data' in data[i].comments) {
                    for (var j=0; j<data[i].comments.data.length; j++) {
                        post = selectiveAdd(post, data, j, 'comment', data[i].comments.data[j].message, req.query.q);
                    }
                }
            }
        res.send(filtered);
        }
    });
}

exports.tw_search = function(req, res) {
    var url = 'statuses/home_timeline?count=200'
    req.twitter(url).get(function(err, data) {

        var filtered = []
        data.forEach(function (tweet) {
            if (tweet.text.contains(req.query.q)) {
                filtered.push({});
                var len = filtered.length;
                var post = filtered[len-1];
                post['post-id'] = tweet.id_str;
                post['type'] = 'twitter';
                post['uid'] = tweet.user.id;
                post['username'] = tweet.user.name;
                post['message'] = tweet.text;
            }
        });
        res.send(filtered);
    });
}

// exports.search = function(req, res) {
//     var result = []
//     if (req.twitter) {
//         var data = tw_search(req, res);
//         data.forEach(function (tweet) {
//             result.push(tweet);
//         });
//     }
//     if (req.facebook) {
//         var data = fb_search(req, res);
//         data.forEach(function (post) {
//             result.push(post);
//         });
//     }
//     console.log(result)
// }
