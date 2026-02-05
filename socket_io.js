/**
 * socket_io.js
 * Socket.IO configuration for real-time functionality
 * Modernized for Socket.IO v4+ and async/await
 */

const { Server } = require('socket.io');
const Message = require('./models/Message');
const User = require('./models/User');
const Util = require('./utils');

let num_clients = 0;

/**
 * Initialize Socket.IO with the HTTP server
 * @param {http.Server} server - HTTP server instance
 * @param {Express.App} app - Express app instance (for reference)
 */
module.exports = function(server, app) {
  
  /**
   * Create Socket.IO instance
   */
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*', // Configure in production
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  /**
   * Socket.IO middleware for authentication
   */
  io.use((socket, next) => {
    const sessionID = socket.handshake.auth.sessionID;
    
    if (process.env.devStatus === 'DEV') {
      console.log('Socket connection attempt:', {
        id: socket.id,
        sessionID: sessionID || 'none',
      });
    }

    // TODO: Add proper session/token validation here
    // For now, allow all connections
    next();
  });

  /**
   * Handle new socket connections
   */
  io.on('connection', (socket) => {
    console.log(`✓ Client connected: ${socket.id}`);

    /**
     * Join user's personal room
     */
    socket.on('join', (data) => {
      if (!data?.myID) {
        console.warn('Join attempt without myID');
        return;
      }

      num_clients++;
      socket.join(data.myID);
      
      if (process.env.devStatus === 'DEV') {
        console.log(`User ${data.myID} joined their room. Total clients: ${num_clients}`);
      }
    });

    /**
     * Leave user's personal room
     */
    socket.on('leave', (data) => {
      if (!data?.myID) {
        console.warn('Leave attempt without myID');
        return;
      }

      num_clients--;
      socket.leave(data.myID);
      
      if (process.env.devStatus === 'DEV') {
        console.log(`User ${data.myID} left their room. Total clients: ${num_clients}`);
      }
    });

    /**
     * Handle new message - Modernized with async/await
     */
    socket.on('new_message', async (data) => {
      try {
        // Validate data
        if (!data?.from || !data?.dest || !data?.msg) {
          socket.emit('msg_failed', {
            ...data,
            error: 'Missing required fields (from, dest, msg)',
          });
          return;
        }

        // Check if sender exists
        const sender = await User.findById(data.from).exec();
        if (!sender) {
          socket.emit('msg_failed', {
            ...data,
            error: 'Sender does not exist',
          });
          return;
        }

        // Check if recipient exists
        const recipient = await User.findById(data.dest).exec();
        if (!recipient) {
          socket.emit('msg_failed', {
            ...data,
            error: 'Recipient does not exist',
          });
          return;
        }

        // Create and save message
        const newMessage = new Message({
          conv_id: Util.getConv_id(data.from, data.dest),
          msg: data.msg,
          from: data.from,
          dest: data.dest,
          timestamp: new Date(),
        });

        await newMessage.save();

        // Emit to recipient's room
        io.to(data.dest).emit('new_message', {
          ...data,
          _id: newMessage._id,
          timestamp: newMessage.timestamp,
        });

        // Confirm to sender
        socket.emit('msg_sent', {
          ...data,
          _id: newMessage._id,
          timestamp: newMessage.timestamp,
        });

        if (process.env.devStatus === 'DEV') {
          console.log(`Message sent from ${data.from} to ${data.dest}`);
        }

      } catch (error) {
        console.error('Error handling new_message:', error);
        socket.emit('msg_failed', {
          ...data,
          error: error.message || 'Failed to send message',
        });
      }
    });

    /**
     * Handle typing indicator
     */
    socket.on('typing', (data) => {
      if (!data?.from || !data?.dest) return;
      
      io.to(data.dest).emit('user_typing', {
        from: data.from,
        isTyping: true,
      });
    });

    /**
     * Handle stop typing indicator
     */
    socket.on('stop_typing', (data) => {
      if (!data?.from || !data?.dest) return;
      
      io.to(data.dest).emit('user_typing', {
        from: data.from,
        isTyping: false,
      });
    });

    /**
     * Handle read receipts
     */
    socket.on('message_read', async (data) => {
      if (!data?.messageId || !data?.readBy) return;

      try {
        await Message.findByIdAndUpdate(
          data.messageId,
          { 
            read: true, 
            readAt: new Date() 
          }
        );

        // Notify sender that message was read
        io.to(data.from).emit('message_read_receipt', {
          messageId: data.messageId,
          readBy: data.readBy,
          readAt: new Date(),
        });
      } catch (error) {
        console.error('Error updating read status:', error);
      }
    });

    /**
     * Handle disconnect
     */
    socket.on('disconnect', (reason) => {
      if (process.env.devStatus === 'DEV') {
        console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
      }
      
      // Clean up if needed
      num_clients = Math.max(0, num_clients - 1);
    });

    /**
     * Handle errors
     */
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  /**
   * Handle Socket.IO server errors
   */
  io.engine.on('connection_error', (err) => {
    console.error('Socket.IO connection error:', {
      code: err.code,
      message: err.message,
      context: err.context,
    });
  });

  console.log('✓ Socket.IO initialized successfully');

  /**
   * Attach io instance to app for use in routes if needed
   */
  app.set('io', io);

  /**
   * Return io instance for external use
   */
  return io;
};