var sqlite3 = require('sqlite3');
var db = new sqlite3.Database('./forumData.db');

db.serialize(function(){
  db.run("INSERT INTO topics (topic_title, popularity) VALUES ('Math in Nature', 0);")

  db.run("INSERT INTO topics (topic_title, popularity) VALUES ('Metaphysics and Consciousness', 0);")


  db.run("INSERT INTO users (forumName, name) VALUES ('The Duke', 'Mike Widman');")

  db.run("INSERT INTO users (forumName, name) VALUES ('CognizeThis', 'Drew Knight Weller');")

  db.run("INSERT INTO users (forumName, name) VALUES ('Lucacious Primate', 'Phil');")

  db.run("INSERT INTO posts (post_title, post_contents, post_user_id, topic_id, popularity, location) VALUES ('The Golden Ratio', 'It appears in lots of things', 1, 1, 0, 'NY');")

  db.run("INSERT INTO posts (post_title, post_contents, post_user_id, topic_id, popularity, location) VALUES ('Fractal Geometry', 'Recursivity...', 1, 1, 0, 'NY');")

  db.run("INSERT INTO posts (post_title, post_contents, post_user_id, topic_id, popularity, location) VALUES ('Unity of the Self', 'An unrelenting dogma pervading much of western psychology is that the Self is best represented as a unity, or essentially unified manifold of discreet aspects or processes....', 2, 2, 0, 'NY');")

  db.run("INSERT INTO comments (contents, comment_user_id, post_id) VALUES ('Like Seashells', 2, 1);")

  db.run("INSERT INTO comments (contents, comment_user_id, post_id) VALUES ('And trees. Really, most organic forms have some amount of self similarity. Nature recycles when possible.', 1, 1);")

  db.run("INSERT INTO comments (contents, comment_user_id, post_id) VALUES ('An example with reference to a specific theory and its terms might be useful', 2, 2);")  

})