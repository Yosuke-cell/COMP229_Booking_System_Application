/**
 * Cat Booking System
 * Group Member: Yosuke Nakamura, Tolga Unal, Yuhan Su, GYUBIN MUN, Juan Rojas Calvimontes
 * This file imports and configure MongoDB connection, imports express application, set up listenning ports, handle ports errors, and initialize the backend.
 */


let configDB = require('./config/db');
let app = require('./config/express');
var http = require('http');
var debug = require('debug')('comp229:server');

/**
 * Listen on provided port, on all network interfaces.
 */

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

configDB();

var server = http.createServer(app);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);


/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;

  console.log('==== The app is running on http://localhost:' + addr.port );
  debug('Listening on ' + bind);
}