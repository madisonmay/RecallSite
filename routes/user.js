
/*
 * GET users listing.
 */
var Models = require('../models.js');
var User = Models.User;

String.prototype.contains = function(it) { return this.indexOf(it) != -1; };

exports.list = function(req, res){
  res.send("respond with a resource");
};

exports.fb_login = function(req, res){
    //Handles facebook authentication
    console.log("Logged in")
    req.facebook.api('/me', function(err, user) {
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
                                             last_name: user.last_name});
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
    res.render('connect', {'title': 'Connect'});
    console.log('user', req.session.user);
}

function selectiveAdd(post, data, i, field, content, query) {
    if (String(data[i].message).toLowerCase().contains(query)) {
        post[field] = data[i][content];
    } else if (query[l-1] == 's') {
        if (String(data[i].message).toLowerCase().contains(query.slice(0, l-1))) {
            post[field] = data[i][content];
        }
    } else if (rquery.slice(l-2, l) == 'es') {
        if (String(data[i].message).toLowerCase().contains(query.slice(0, l-2))) {
            post[field] = data[i][content];
        }
    } else {
        post[field] = '';
    }
    return post
}

exports.fb_search = function(req, res) {
    var url = '/me/home?q=' + req.query.q;
    req.facebook.api(url, function(err, data) {
        var filtered = []
        console.log(err);
        console.log(data);
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
                post = selectiveAdd(post, data, i, 'message', 'message', req.query.q)
            }
        }
        console.log(filtered)
        res.render('search', {
            title: 'Recall',
            user: req.session.user,
            query: req.query.q,
            username: req.session.user.first_name,
            posts: filtered
        })
    });
}
