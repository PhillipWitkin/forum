var express = require('express');
var sqlite3 = require('sqlite3')
var fs = require('fs');
var request = require('request')
var Mustache = require('mustache');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');

var db = new sqlite3.Database('./forumData.db');
var app = express();

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false}))
app.use(methodOverride('_method'));


app.get('/', function(req, res){
  var htmlIndex = fs.readFileSync('./pages/index.html', 'utf8');
  res.send(htmlIndex)
})

//lists all topics
app.get('/topics', function(req, res) {
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
  db.all("SELECT * FROM topics WHERE (topicID = $id)", {$id: topicId}, function(err, topics) {
    var newPostForm = fs.readFileSync('./pages/newPost_form.html', 'utf8');
    var htmlNewPostForm = Mustache.render(newPostForm, topics[0])
    res.send(htmlNewPostForm)  
  })
})

//adds a new post under a topic
app.post('/topics/:id/posts', function(req, res) {
  console.log(req.params)
  var topicId = req.params.id
  var newPost = req.body

  // gets location for post

    //insert post to database
    db.run("INSERT INTO posts (post_title, post_contents, post_author, topic_id) VALUES ($title, $contents, $author, $topic_id)", {
      $title: newPost.post_title,
      $contents: newPost.post_contents,
      // $user_id: newPost.user_id,
      $author: newPost.post_author,
      $topic_id: topicId
      // $location: ,
      // $date: 
    })
  res.redirect('/topics/'+ topicId +'/posts')
}) 

//shows all comments for a post
app.get('/topics/:topic_id/posts/:post_id/comments', function(req, res) {
  console.log(req.params)
  var postId = req.params.post_id
  db.serialize(function() {
    //get all comments for the post, with each comment's author
    db.all("SELECT * FROM comments LEFT JOIN users ON (users.userID = comments.user_id) WHERE (post_id = $postId)", {$postId: postId}, function(err, comments){

      //get information for the post and the post's author
      db.all("SELECT * FROM comments INNER JOIN posts ON (posts.postID = comments.post_id) LEFT JOIN users ON (users.userID = posts.user_id) WHERE (post_id = $postId)", {$postId: postId}, function(err, posts) {
        var postMain = posts[0]
        displayComments(comments, postMain)
      })
      
    })
    function displayComments(comments, post) {

      var template = fs.readFileSync('./pages/comments.html', 'utf8')
      var renderedHtml = Mustache.render(template, {
        allComments: comments,
        postTitle: post.post_title,
        postContents: post.post_contents,
        postAuthor: post.forumName
      })
      res.send(renderedHtml)
    }
  
  })//end serialize

})


//form for new comment
app.get('/topics/:topic_id/posts/:post_id/comments/new_comments', function(req, res) {
  var template = fs.readFileSync('/pages/newComment_form.html', 'utf8');
  var htmlNewCommentForm = Mustache.render(template, )
  res.send(htmlNewCommentForm)
})

//adds a new comment under a post
app.post('/topics/:topic_id/posts/:post_id/comments', function(req, res) {
  var topicId = req.params.topic_id
  var postId = req.params.post_id
  var newComment = req.body

  // gets location for post

    //insert comment to database
    db.run("INSERT INTO comments (contents, user_id, post_id, location) VALUES ($contents, $user_id, $post_id)", {
      $contents: newComment.contents,
      $comment_author: newComment.author,
      $post_id: postId
      // $location: ,
      // $date: 
    })
  res.redirect('/topics/'+ topic_id +'/posts/'+ post_id + '/comments')
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
