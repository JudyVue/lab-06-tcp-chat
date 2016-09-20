'use strict';

const net = require('net');
const EE = require('events');



const Client = require('./model/client.js');

const PORT = process.env.PORT || 3000;

const pool = [];
const nickNamesArray = [];
const server = net.createServer();
const ee = new EE();

ee.on('\\user', function(client, string){
  client.nickname = string.trim();
  nickNamesArray.push(client.nickname);
  console.log(nickNamesArray);
});


ee.on('\\all', function(client, string){
  pool.forEach( c => {
    c.socket.write(`${client.nickname}: ` + string);
  });
});

ee.on('\\showusers', function(){
  console.log(pool, ' line 28');
});



ee.on('\\dm', function(client, string){
  client.socket.write(`Hi ${client.nickname} . Write a message to another user. These are the other users, including yourself: `);
  console.log(`${nickNamesArray}`);
  client.socket.write(`${nickNamesArray}`);
  client.socket.write('\n Choose a name:  ', string);
  //TODO: I have no idea what to do here now

});



ee.on('default', function(client){
  client.socket.write('not a command');
});


server.on('connection', function(socket){
  var client = new Client(socket);
  pool.push(client);
  socket.on('error', function(err){
    console.log(err);
  });
  socket.on('data', function(data){
    const command = data.toString().split(' ').shift().trim();
    if (command.startsWith('\\')){
      ee.emit(command, client, data.toString().split(' ').slice(1).join(' '));
      return;
    }
    socket.on('close', function(){
      pool.forEach((c, i) => {
        if(c.nickname === client.nickname){
          console.log('pool.before', pool);
          pool.splice(i, 1);
          //TODO: This isn't writing to the chatroom
          ee.emit('\\all', client, ' logged out.');
          console.log(`${client.nickname} logged out`);
          console.log('pool after', pool);
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
