var express = require('express');
var sqlite3 = require('sqlite3')
var fs = require('fs');
var request = require('request')
var Mustache = require('mustache');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');

var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session')

var flash = require('connect-flash');
var bcrypt = require('bcrypt');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var db = new sqlite3.Database('./forumData.db');
var app = express();

app.use(express.static(__dirname + '/public'));
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false}));
app.use(methodOverride('_method'));
app.use(cookieParser());
// app.use(session({ cookie: { maxAge: 60000 }}));
app.use(cookieSession({name: 'session', keys:['userID']}))
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());


//sync
// var hashedPassword = bcrypt.hashSync(password, 10)

//sync function to compare password string with hash in DB
var verifyPassword = function(password, hash){
  return bcrypt.compareSync(password, hash)
}

passport.use(new LocalStrategy(
{passReqToCallback : true},
  function(req, username, password, done){
    db.serialize(function(){
      db.all('SELECT password FROM users WHERE (username = $username)',{$username: username}, function(err, userData){
        // if (err) { return done(err); }
        if (!userData[0]) {
          console.log("no user from db")
          return done(null, false, req.flash('message', "No username found."))
        }
        console.log(password)
        console.log(userData)
        var passwordStatus = verifyPassword(password, userData[0].password)
        // bcrypt.compare(password, userData.password, function(err, res){       
        // })
        if (passwordStatus === false){
          return done(null, false, req.flash('message', "Incorrect password."))
          
        }else if (passwordStatus === true){
          db.all('SELECT username, userID FROM users WHERE (username = $username)', {$username: username}, function(err, user){
            return done(null, user[0])
          })
        }

      })
      
    })//end serialize
  }
))

passport.serializeUser(function(user, done){
  return done(null, user.userID)
})

passport.deserializeUser(function(userID, done){
  db.all('SELECT userID, username FROM users WHERE (userID = $userID)',{$userID: userID}, function(err, userData){
    if (!userData){
      return done(null, false)
    }
    return done(null, userData[0])
  })
})


//home page
app.get('/', function(req, res){
  var htmlIndex = fs.readFileSync('./pages/index.html', 'utf8');
  res.send(htmlIndex)
})

// //login page
app.get('/login', function(req, res){
  // console.log(req.flash())
  var loginMessage = {
    message: req.flash('message')[0], 
    error: req.flash('error')[0]
  }
  console.log(loginMessage)
  var templateLogin = fs.readFileSync('./pages/login.html', 'utf8');
  var htmlLogin = Mustache.render(templateLogin, loginMessage);
  res.send(htmlLogin)
})

//login attempt
app.post('/login', passport.authenticate('local', {
  successRedirect: '/topics',
  failureRedirect: '/login',
  failureFlash: true
}))

// //login attempt
// app.post('/topics/:id/posts/new_post/login', passport.authenticate('local', {
//   successRedirect: '/topics/' + req.params.id + '/posts/new_post',
//   failureRedirect: '/topics/' + req.params.id + '/posts/new_post',
//   failureFlash: true
// }))


//registration page
app.get('/register', function(req,res){
  var templateRegister = fs.readFileSync('./pages/register.html', 'utf8');
  var errorMessage = {error: req.flash('error')[0]}
  var htmlRegister = Mustache.render(templateRegister, errorMessage)
  res.send(htmlRegister)
})

app.post('/register', function(req,res){
  var newUser = req.body
  var templateRegister = fs.readFileSync('./pages/register.html', 'utf8');
  //check to make sure the username and password fields are not blank
  if (!newUser.username || !newUser.password){
    var errorMessage = "Username and password must be provided"
    req.flash('error', errorMessage)
    res.redirect('/register');
  }else{
    db.all("SELECT username FROM users WHERE (username = $username)", {$username: newUser.username}, function(err, user){
      console.log(user)
      if (!user[0]){
        //hash password and send user info to DB
        bcrypt.hash(newUser.password, 10, function(err, hash){
          console.log(hash)
          //store in DB
          db.run("INSERT INTO users (username, password) VALUES ($username, $password)",{
            $username: newUser.username,
            $password: hash
          })
        completeRegisterMessage = "Registration completed successfully. Welcome " + newUser.username + ", you can now log in"  
        req.flash('message', completeRegisterMessage)  
        res.redirect('/login')
        })
      }else {
        var errorMessage = "Username already exists"      
        // var htmlRegister = Mustache.render(templateRegister, {error: errorMessage})
        // res.send(htmlRegister)
        req.flash('error', errorMessage)
        res.redirect('/register');
      }
    })
    
  }
})




//logout
app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
})


//lists all topics
app.get('/topics', function(req, res) {
  console.log(req.user)
  var topicsTemplate = fs.readFileSync('./pages/topics.html', 'utf8');
  db.all('SELECT * FROM topics', function(err, topics) {
    var htmlTopics = Mustache.render(topicsTemplate, {allTopics: topics});
    res.send(htmlTopics)
  })
});

//lists all posts under a topic
app.get('/topics/:id/posts', function(req, res) {
  console.log(req.params)
  var topicId = req.params.id
  // console.log(topicId)
  var postsTemplate = fs.readFileSync('./pages/posts.html', 'utf8');
  // db.serialize(function() {
    db.all('SELECT * FROM posts LEFT JOIN users ON (users.userID = posts.user_id) WHERE (topic_id = $topicId)', {$topicId: topicId}, function(err, posts){

        console.log(posts)
        var htmlPosts = Mustache.render(postsTemplate, {allPosts: posts, topic_id: topicId})
        res.send(htmlPosts)
    })
      
  // })//end serialize funk
})


//updates popularity for a topic
app.put('/topics/topic_:id/posts', function(req, res) {
  var topicId = req.params.id;
  var favroiteCount = req.body.popularity + 1

  db.run("UPDATE topics SET popularity = $newCount WHERE topicID = $topicId", {
    $newCount: favroiteCount,
    $topicId: topicId
  });
  res.redirect('/topics/:topic_id/posts')
})

//form for new post
app.get('/topics/:id/posts/new_post', function(req, res) {
  var topicId = req.params.id
  console.log(topicId);
  if (req.user){
    var userMessage = "You are logged in as " + req.user.username + ", which will appear as the post author."
  }else {
    var userMessage = "You are not logged in. You can post anonymously, or login to post with your username"
    var loginDest = '/login'
    var loginText = "Log in before posting"
    // var newPostForm = fs.readFileSync('./pages/newPost_form_anonymous', 'utf8');
  }
  db.all("SELECT * FROM topics WHERE (topicID = $id)", {$id: topicId}, function(err, topics) {
    var newPostForm = fs.readFileSync('./pages/newPost_form.html', 'utf8');
    var renderData = {
      topicID: topics[0].topicID,
      topic_title: topics[0].topic_title,
      message: userMessage,
      loginRoute: loginDest,
      loginText: loginText
    }
    var htmlNewPostForm = Mustache.render(newPostForm, renderData)
    res.send(htmlNewPostForm)  
  })
})

//adds a new post under a topic
app.post('/topics/:id/posts', function(req, res) {
  console.log(req.params)
  var topicId = req.params.id
  var postNew = req.body
  // if the user is logged in, they will be the author
  if (req.user){
    var postAuthor = req.user.username
  }else {
    var postAuthor = "anonymous"
    var userId = null
  }

    //insert post to database
    db.run("INSERT INTO posts (post_title, post_contents, post_author, topic_id, user_id) VALUES ($title, $contents, $author, $topic_id, $user_id)", {
      $title: postNew.post_title,
      $contents: postNew.post_contents,
      $topic_id: topicId,
      $author: postAuthor,
      $user_id: userId
      // $location: ,
      // $date: 
    })
  res.redirect('/topics/'+ topicId +'/posts')
}) 

//shows all comments for a post
app.get('/topics/:topic_id/posts/:post_id/comments', function(req, res) {
  console.log(req.params)
  var postId = req.params.post_id
  var topicId = req.params.topic_id
  db.serialize(function() {
    //get all comments for the post, with each comment's author
    db.all("SELECT * FROM comments LEFT JOIN users ON (users.userID = comments.user_id) WHERE (post_id = $postId)", {$postId: postId}, function(err, comments){

      //get information for the post and the post's author
      db.all("SELECT * FROM posts LEFT JOIN users ON (users.userID = posts.user_id) WHERE (postID = $postId)", {$postId: postId}, function(err, posts) {
        var postMain = posts[0]
        displayComments(comments, postMain)
      })
      
    })
    function displayComments(comments, post) {

      var template = fs.readFileSync('./pages/comments.html', 'utf8')
      var renderedHtmlComments = Mustache.render(template, {
        allComments: comments,
        postTitle: post.post_title,
        postContents: post.post_contents,
        postAuthor: post.post_author,
        topic_id: topicId,
        post_id: postId
      })
      res.send(renderedHtmlComments)
    }
  
  })//end serialize

})


//form for new comment
app.get('/topics/:topic_id/posts/:post_id/comments/new_comment', function(req, res) {
  var postId = req.params.post_id
  var topicId = req.params.topic_id
  if (req.user){
    var userMessage = "You are logged in as " + req.user.username + ", which will appear as the post author."
  }else {
    var userMessage = "You are not logged in. You can post anonymously, or login to post with your username"
    var loginDest = '/login'
    var loginText = "Log in before posting"
    // var newPostForm = fs.readFileSync('./pages/newPost_form_anonymous', 'utf8');
  }
  db.all("SELECT * FROM posts LEFT JOIN users ON (users.userID = posts.user_id) WHERE (postID = $postId)", {$postId: postId}, function(err, posts){
    var postForComment = posts[0]
    var template = fs.readFileSync('./pages/newComment_form.html', 'utf8');
    var htmlNewCommentForm = Mustache.render(template, {
      topic_id: topicId,
      post_id: postId,
      postTitle: postForComment.post_title,
      postContents: postForComment.post_contents,
      postUserName: postForComment.forumName,
      postAuthor: postForComment.post_author,
      message: userMessage,
      loginText: loginText
    })
  
    res.send(htmlNewCommentForm)
  })
})

//adds a new comment under a post
app.post('/topics/:topic_id/posts/:post_id/comments', function(req, res) {
  // gets location for post
  var topicId = req.params.topic_id
  var postId = req.params.post_id
  var newComment = req.body
  // if the user is logged in, they will be the author
  if (req.user){
    var commentAuthor = req.user.username
  }else {
    var commentAuthor = "anonymous"
    var userId = null
  }
    //insert comment to database
    db.run("INSERT INTO comments (post_id, contents, comment_author, user_id) VALUES ($post_id, $contents, $comment_author, $user_id)", {
      $post_id: postId,
      $contents: newComment.contents,
      $comment_author: commentAuthor,
      $user_id: userId
      // $location: ,
      // $date: 
    })
  res.redirect('/topics/'+ topicId +'/posts/'+ postId + '/comments')
})

//updates popularity for a post
app.put('/topics/:topic_id/posts/:post_id/comments', function(req, res) {
  var postId = req.params.post_id;
  var topicId = req.params.topic_id;
  var favroiteCount = req.body.popularity + 1

  db.run("UPDATE posts SET popularity = $newCount WHERE postID = $postId", {
    $newCount: favroiteCount,
    $postId: postId
  });
  res.redirect('/topics/' + topicId +'/posts/'+ postId +'/comments')
})

app.listen(3000, function() {
  console.log("LISTENING!");
});
