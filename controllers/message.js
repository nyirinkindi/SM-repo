// controllers/message.js
const Message = require('../models/Message');

exports.getConversation = async (req, res) => {
  try {
    const { convId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const messages = await Message.getConversation(convId, {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    });
    
    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversations = await Message.getUserConversations(userId);
    
    res.json({ conversations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { dest, msg, messageType = 'text', attachment = null } = req.body;
    const from = req.user._id;
    
    const Util = require('../utils');
    const conv_id = Util.getConv_id(from, dest);
    
    const message = new Message({
      conv_id,
      from,
      dest,
      msg,
      messageType,
      attachment
    });
    
    await message.save();
    
    // Emit via Socket.IO
    const io = req.app.get('io');
    io.to(dest.toString()).emit('new_message', message);
    
    res.status(201).json({ message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { convId } = req.params;
    const userId = req.user._id;
    
    await Message.markAsRead(convId, userId);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const count = await Message.getUnreadCount(userId);
    
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.searchMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const { q: searchTerm, page = 1, limit = 20 } = req.query;
    
    const messages = await Message.searchMessages(userId, searchTerm, {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    });
    
    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;
    
    await Message.softDelete(messageId, userId);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};