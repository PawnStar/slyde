var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

//All the possible open pages
var presentations = {};

app.get('/', function(req, res){
  console.log(" sending index file");
  res.sendFile(__dirname + '/index.html');
});

app.get('/remote', function(req,res){
  res.sendFile(__dirname + '/remote.html');
})

io.on('connection', function(socket){
  //Ask new connections to register
  console.log('Asking connection to register');
  socket.emit('register');

  //Unregister if disconnected
  socket.on('disconnect', function(){
    for( var key in presentations ) {
      if( presentations.hasOwnProperty( key ) ) {
         if( presentations[key].socket === socket ){
           console.log("Disconnecting socket: " + key);
           delete presentations[key];
         }
      }
    }
  })

  //Presentation page events
  socket.on('register', function(id){
    if(presentations[id] && presentations[i].socket != socket)
      return socket.emit('re-register');
    presentations[id] = {socket: socket, notes: null};
    console.log('Registering page: ' + id);
    socket.emit('registered', id);
  });

  socket.on('update-notes', function(data){
    if(!presentations[data.id])
      return socket.emit('register');
    presentations[data.id] = {socket: socket, notes: data.notes};
    socket.broadcast.emit('status-' + data.id, data.notes);
  })

  //Remote events
  socket.on('register-control', function(id){
    if(presentations[id]){
      console.log("Registering remote for page: " + id);
      socket.emit('success-control', {id: id, notes: presentations[id].notes})
      presentations[id].socket.emit('request-notes');
    }else{
      socket.emit('retry');
    }
  })

  socket.on('control-next', function(id){
    console.log("Moving " + id + " to next slide");
    if(presentations[id])
      presentations[id].socket.emit('move-next');
    else
      socket.emit('retry');
  })
  socket.on('control-prev', function(id){
    console.log("Moving " + id + " to previous slide");
    if(presentations[id])
      presentations[id].socket.emit('move-prev');
    else
      socket.emit('retry');
  })
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
