
/*
 * GET users listing.
 */
var Models = require('../models.js');
var User = Models.User;

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
                    req.session.user = db_user.fb_id;
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
                            req.session.user = new_user.fb_id;
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
    console.log(req.session.user);
}

exports.fb_search = function(req, res) {
    console.log(req.query.q)
    var url = '/me/home?' + 'limit=200';
    console.log(url);
    req.facebook.api(url, function(err, data) {
        console.log(err);
        console.log(data);
        res.send(data)
    });
}
