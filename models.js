var mongoose = require('mongoose');
mongoose.connect(process.env.MONGOLAB_URI || 'mongodb://localhost/recall');

var userSchema = mongoose.Schema({
    fb_id: String,
    tw_id: String,
    twitter_id: String,
    first_name: String,
    last_name: String
})

var User = mongoose.model('User', userSchema);
exports.User = User;

