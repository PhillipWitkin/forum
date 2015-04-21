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

//shows all posts under a topic
app.get('/topics/topic_:id/posts', function(req, res) {
  var topicId = req.params.id
  // console.log(topicId)
  db.serialize(function() {
    db.all("SELECT * FROM topics WHERE (id = $topicId)", {$topicId: topicId}, function(err, topics){
      // console.log(topics)
      db.all("SELECT * FROM posts WHERE (topic_id = $topic)", {$topic: topicId}, function(err,posts){
      // console.log(posts)
      // console.log(topics[0].topic_id)
      // console.log(topics[0])
        var postAuthors = []
        var i = 0


        posts.forEach(function(element){
          db.all("SELECT * FROM users WHERE (id = $user)", {$user: element.post_user_id}, function(err, users) {
              // i= 0
              i++
          postAuthors.push(users[0])
                             
          if (i === posts.length) {
            console.log(postAuthors)
              postsTemplate = fs.readFileSync('./pages/posts.html', 'utf8');
            renderMoi = {
              allPosts : posts,
              topic_title : topics[0].topic_title,
              topic_id: topics[0].id,
              allAuthors: postAuthors
            }

            var render = Mustache.render(postsTemplate, renderMoi)
          res.send(render)

         

          
          }

        })//end users query 
      })//end foreach loop
      
           // console.log(topics)
           //  console.log(posts)
       
      
      })//end posts query
        
    })//end topics query
      // var topicData = topics[0]
      // displayPosts(topicId, topicData)
    


    // function displayPosts(topicId, topicData, users) {
    //   db.all("SELECT * FROM posts WHERE (topic_id = $topic)", {$topic: topicId}, function(err, posts) {
    //     // posts.push(topicData)
    //     postAuthors = []
    //     posts.forEach(function(element) {
    //       db.all("SELECT * FROM users WHERE (id = $user)", {$user: element.user_id}, function(err, users) {
    //         postAuthors.push(users[0])
    //       })
    //     })
    //     fs.readFile('./pages/posts.html', 'utf8', function(err, html){
    //       // console.log(topicData) 
    //       var renderedHtml = Mustache.render(html, { stuff: topicData,  
    //         allPosts: posts,
    //         allAuthors: postAuthors 
    //       });
    //       res.send(renderedHtml)
    //     })
    //   })
    // }
  })//end serialize funk
})

//updates popularity for a topic
app.put('/topics/topic_:id/posts', function(req, res) {
  var topicId = req.params.id;
  var favroiteCount = req.body.popularity + 1

  db.run("UPDATE topics SET popularity = $newCount WHERE id = $topicId", {
    $newCount: favroiteCount,
    $topicId: topicId
  });
  res.redirect('/topics/:topic_id/posts')
})

//form for new post
app.get('/topics/topic_:id/posts/new_post', function(req, res) {
  var topicId = req.params.id
  console.log(topicId);
  db.all("SELECT * FROM topics WHERE (id = $id)", {$id: topicId}, function(err, topics) {
    var newPostForm = fs.readFileSync('./pages/newPost_form.html', 'utf8');
    var htmlNewPostForm = Mustache.render(newPostForm, topics[0])
    res.send(htmlNewPostForm)  
  })
})

//adds a new post under a topic
app.post('/topics/topic_:id/posts', function(req, res) {
  console.log(req.params)
  var topicId = req.params.id
  var newPost = req.body

  // gets location for post

    //insert post to database
    db.run("INSERT INTO posts (post_title, post_contents, post_user_id, topic_id) VALUES ($title, $contents, $user_id, $topic_id)", {
      $title: newPost.post_title,
      $contents: newPost.post_contents,
      $user_id: newPost.user_id,
      $topic_id: topicId
      // $location: ,
      // $date: 
    })
  res.redirect('/topics/topic_'+topicId +'/posts')
}) 

//shows all comments for a post
app.get('/topics/:topic_id/posts/post_:id/comments', function(req, res) {
  console.log(req.params)
  var postId = req.params.id
  db.serialize(function() {
    db.all("SELECT * FROM posts WHERE (id = $postId)", {$postId: postId}, function(err, posts){
      var postData = posts[0]

      db.all("SELECT * FROM users WHERE (id = $user)", {$user: postData.post_user_id}, function(err, users) {
        var postUser = users[0]
        displayComments(postId, postData, postUser)
      })
      
    })
    function displayComments(postId, postData, postUser) {
      db.all("SELECT * FROM comments WHERE (post_id = $post)", {$post: postId}, function(err, comments) {
        commentAuthors = []
        comments.forEach(function(element, index, array) {
          db.all("SELECT * FROM users WHERE (id = $user)", {$user: element.comment_user_id}, function(err, users) {
            commentAuthors.push(users[0])
           })
        })
        // comments.push(postUser)
        // comments.push(postData)
        var renderMePlease = {
          allComments: comments,
          allAuthors: commentAuthors
        }

        var template = fs.readFileSync('./pages/comments.html', 'utf8')
        var renderedHtml = Mustache.render(template, {
            allComments: comments,
            allAuthors: commentAuthors,
            postTitle: postData.post_title,
            postContents: postData.post_contents,
            postAuthor: postData.post_user_id
          });
          res.send(renderedHtml)
      })
    }
  })
})


//form for new comment
app.get('/topics/:topic_id/posts/:post_id/comments/new_comments', function(req, res) {
  var htmlNewCommentForm = fs.readFileSync('/pages/newComment_form.html', 'utf8');
  res.send(htmlNewCommentForm)
})

//posts a new comment under a post
app.post('/topics/:topic_id/posts/post_:id/comments', function(req, res) {
  var postId = req.params.post_id
  var newComment = req.body

  // gets location for post

    //insert post to database
    db.run("INSERT INTO comments (contents, user_id, post_id, location) VALUES ($contents, $user_id, $post_id)", {
      $contents: newComment.contents,
      $user_id: newComment.author,
      $post_id: postId
      // $location: ,
      // $date: 
    })
  res.redirect('/topics/:topic_id/posts/:post_id/comments')
})

//updates popularity for a post
app.put('/topics/:topic_id/posts/:post_id/comments', function(req, res) {
  var postId = req.params.post_id;
  var favroiteCount = req.body.popularity + 1

  db.run("UPDATE posts SET popularity = $newCount WHERE id = $postId", {
    $newCount: favroiteCount,
    $postId: postId
  });
  res.redirect('/topics/:topic_id/posts/:post_id/comments')
})

app.listen(3000, function() {
  console.log("LISTENING!");
});
