var sqlite3 = require('sqlite3');
var db = new sqlite3.Database('./forumData.db');

db.run("CREATE TABLE topics (topicID INTEGER PRIMARY KEY AUTOINCREMENT, topic_title VARCHAR, popularity INTEGER);")

db.run("CREATE TABLE posts (postID INTEGER PRIMARY KEY AUTOINCREMENT, post_title VARCHAR, post_contents, post_author VARCHAR, user_id INTEGER, topic_id INTEGER, popularity INTEGER, location VARCHAR, date VARCHAR);")

db.run("CREATE TABLE comments (commentID INTEGER PRIMARY KEY AUTOINCREMENT, contents VARCHAR, comment_author, user_id INTEGER, post_id INTEGER, location VARCHAR, date VARCHAR);")

db.run("CREATE TABLE users (userID INTEGER PRIMARY KEY AUTOINCREMENT, forumName VARCHAR, name VARCHAR, username VARCHAR, password VARCHAR);")
