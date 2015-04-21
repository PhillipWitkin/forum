var sqlite3 = require('sqlite3');
var db = new sqlite3.Database('./forumData.db');

db.run("CREATE TABLE topics (id INTEGER PRIMARY KEY AUTOINCREMENT, topic_title VARCHAR, popularity INTEGER);")

db.run("CREATE TABLE posts (id INTEGER PRIMARY KEY AUTOINCREMENT, post_title, post_contents, post_user_id INTEGER, topic_id INTEGER, popularity INTEGER, location VARCHAR, date VARCHAR);")

db.run("CREATE TABLE comments (id INTEGER PRIMARY KEY AUTOINCREMENT, contents VARCHAR, comment_user_id INTEGER, post_id INTEGER, location VARCHAR, date VARCHAR);")

db.run("CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, forumName VARCHAR, name VARCHAR);")
