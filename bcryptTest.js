var bcrypt = require('bcrypt');

//generates the password hash
// bcrypt.genSalt(10, function(err, salt) {
//     bcrypt.hash('wacky', salt, function(err, hash) {
//         // Store hash in your password DB.
//         console.log(hash) 
//     });
// });

//generate hash from password
bcrypt.hash('daemonPhil', 10, function(err, hash){
  console.log(hash)
  //store hash in DB
})


//compare password string with hash in DB
bcrypt.compare("wacky",'$2a$10$.9q6ZMkxyozFSL8k0Rsar.tNSi0RUEQ9.V6o1avQGkqIjvRzOlQ0K', function(err, res){
  // console.log(res)
  //if res==true then the hash
})


// console.log(checkPassword('wacky', '$2a$10$leHWCVlJ.CGOk10ID2xT0eq1.SnMtQAIMb4mggu83cOnkK2ie/VHO'))
var status = function(password, hash){
  return bcrypt.compareSync(password, hash)
}
var checked = status("wacky",'$2a$10$.9q6ZMkxyozFSL8k0Rsar.tNSi0RUEQ9.V6o1avQGkqIjvRzOlQ0K')
console.log(checked)
