'use strict';


require('dotenv').config();
const net = require('net');
const EE = require('events');

const Client = require('./model/client.js');

const PORT = process.env.PORT || 3000;

const pool = [];
const server = net.createServer();
const ee = new EE();

ee.emit('\\random', 'a', 'b');

ee.on('\\random', (a, b) => {
  console.log(' what is this a?', a);
  console.log('what is b', b);
});

ee.setMaxListeners(Infinity);

ee.on('\\user', function(client, string){
  console.log(client.id);
  client.nickname = string.trim();
});


ee.on('\\all', function(client, string){
  pool.forEach( c => {
    c.socket.write(`${client.nickname}: ${string}`);
  });
});

ee.on('\\showusers', function(client){
  console.log(pool, ' line 28');
  let users = pool.map((user) => {
    return user.nickname;
  });
  client.socket.write(`Here are the available users in this chatroom. Type "\\dm <username>" and then your message to chat with another user.\n${users}\n`);
});



ee.on('\\dm', function(client, string){
  //1. First, we iterate through the pool array to determine if the name following '\dm <name>' matches the nickname property of the clients in our pool
  pool.forEach(target => {
    if (target.nickname === string.split(' ').shift().trim()){

      //2. If we have a match, the current client's chat gets the message of 'Chat from <myself> to <target user>: <client name>: personal message to target user'
      client.socket.write(`\nChat from ${client.nickname} to ${target.nickname}\n${client.nickname}: ${string.split(' ').slice(1).join(' ')}`);

      //3. The target user receives the incoming message in the form of '<sender's name>: sender's personal msg'. If they wish to message back, they must all do '\dm' command in Step#2.
      target.socket.write(`${client.nickname}: ${string.split(' ').slice(1).join(' ')}`);
    }
  });
});


ee.on('default', function(client){
  client.socket.write('not a command\n');
});


server.on('connection', function(socket){
  var client = new Client(socket);
  pool.push(client);
  socket.on('error', function(err){
    console.log(err);
  });
  //data is anything the user types in the chat room
  socket.on('data', function(data){
    const command = data.toString().split(' ').shift().trim();
    if (command.startsWith('\\')){
      ee.emit(command, client, data.toString().split(' ').slice(1).join(' '));
      return;
    }
    socket.on('close', function(){
      pool.forEach((c, i) => {
        if(c.id === client.id){
          pool.splice(i, 1);
          ee.emit('\\all', client, ' logged out.\n');
          socket.on('error', function(err){
            console.log(err);
          });
          return;
        }
      });
    });
    ee.emit('default', client, data.toString());
  });
});


server.listen(PORT, function(){
  console.log('server running on port', PORT);
});
