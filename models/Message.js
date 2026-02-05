/**
 * models/Message.js
 * Message model for real-time chat functionality
 * Modernized for Mongoose 7+ with additional features
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Message Schema
 * Stores messages between users with conversation tracking
 */
const MessageSchema = new Schema(
  {
    // Conversation ID (unique identifier for chat between two users)
    conv_id: {
      type: String,
      required: [true, 'Conversation ID is required'],
      trim: true,
      index: true, // Index for faster queries
    },

    // Sender's user ID
    from: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender ID is required'],
      index: true,
    },

    // Recipient's user ID
    dest: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient ID is required'],
      index: true,
    },

    // Message content
    msg: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: [5000, 'Message cannot exceed 5000 characters'],
    },

    // Read status
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    // When message was read
    readAt: {
      type: Date,
      default: null,
    },

    // Message type (text, image, file, etc.)
    messageType: {
      type: String,
      enum: ['text', 'image', 'file', 'video', 'audio'],
      default: 'text',
    },

    // Attachment URL (if any)
    attachment: {
      type: String,
      default: null,
    },

    // Deleted status (soft delete)
    isDeleted: {
      type: Boolean,
      default: false,
    },

    // Deleted by users (for individual deletion)
    deletedBy: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
  {
    // Automatic timestamps
    timestamps: {
      createdAt: 'time',
      updatedAt: 'updatedAt',
    },
    // Enable virtuals in JSON/Object output
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Compound Indexes for better query performance
 */
// Index for fetching conversation messages
MessageSchema.index({ conv_id: 1, time: -1 });

// Index for unread messages
MessageSchema.index({ dest: 1, isRead: 1 });

// Index for user's messages
MessageSchema.index({ from: 1, time: -1 });
MessageSchema.index({ dest: 1, time: -1 });

/**
 * Virtual: Get formatted time
 */
MessageSchema.virtual('formattedTime').get(function() {
  return this.time ? this.time.toISOString() : null;
});

/**
 * Virtual: Check if message is recent (less than 5 minutes old)
 */
MessageSchema.virtual('isRecent').get(function() {
  if (!this.time) return false;
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return this.time > fiveMinutesAgo;
});

/**
 * Pre-save middleware
 * Validate and process message before saving
 */
MessageSchema.pre('save', function(next) {
  // Trim message content
  if (this.msg) {
    this.msg = this.msg.trim();
  }

  // Validate conversation ID format
  if (this.conv_id && !this.conv_id.includes('_')) {
    return next(new Error('Invalid conversation ID format'));
  }

  next();
});

/**
 * Static Methods
 */

/**
 * Get messages for a conversation
 * @param {String} convId - Conversation ID
 * @param {Object} options - Query options (limit, skip, etc.)
 * @returns {Promise<Array>} Array of messages
 */
MessageSchema.statics.getConversation = async function(convId, options = {}) {
  const {
    limit = 50,
    skip = 0,
    includeDeleted = false,
  } = options;

  const query = { conv_id: convId };
  
  if (!includeDeleted) {
    query.isDeleted = false;
  }

  return this.find(query)
    .populate('from', 'name email profile_picture')
    .populate('dest', 'name email profile_picture')
    .sort({ time: -1 })
    .limit(limit)
    .skip(skip)
    .lean()
    .exec();
};

/**
 * Get unread message count for a user
 * @param {ObjectId} userId - User ID
 * @returns {Promise<Number>} Count of unread messages
 */
MessageSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({
    dest: userId,
    isRead: false,
    isDeleted: false,
  });
};

/**
 * Mark messages as read
 * @param {String} convId - Conversation ID
 * @param {ObjectId} userId - User ID (recipient)
 * @returns {Promise<Object>} Update result
 */
MessageSchema.statics.markAsRead = async function(convId, userId) {
  return this.updateMany(
    {
      conv_id: convId,
      dest: userId,
      isRead: false,
    },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    }
  );
};

/**
 * Get all conversations for a user
 * @param {ObjectId} userId - User ID
 * @returns {Promise<Array>} Array of conversations with last message
 */
MessageSchema.statics.getUserConversations = async function(userId) {
  const conversations = await this.aggregate([
    // Match messages where user is sender or recipient
    {
      $match: {
        $or: [
          { from: userId },
          { dest: userId },
        ],
        isDeleted: false,
      },
    },
    // Sort by time descending
    { $sort: { time: -1 } },
    // Group by conversation to get last message
    {
      $group: {
        _id: '$conv_id',
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$dest', userId] },
                  { $eq: ['$isRead', false] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
    // Sort by last message time
    { $sort: { 'lastMessage.time': -1 } },
    // Lookup user details
    {
      $lookup: {
        from: 'users',
        localField: 'lastMessage.from',
        foreignField: '_id',
        as: 'fromUser',
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'lastMessage.dest',
        foreignField: '_id',
        as: 'destUser',
      },
    },
    // Project final shape
    {
      $project: {
        conv_id: '$_id',
        lastMessage: 1,
        unreadCount: 1,
        fromUser: { $arrayElemAt: ['$fromUser', 0] },
        destUser: { $arrayElemAt: ['$destUser', 0] },
      },
    },
  ]);

  return conversations;
};

/**
 * Delete message (soft delete)
 * @param {ObjectId} messageId - Message ID
 * @param {ObjectId} userId - User ID (who is deleting)
 * @returns {Promise<Object>} Updated message
 */
MessageSchema.statics.softDelete = async function(messageId, userId) {
  const message = await this.findById(messageId);
  
  if (!message) {
    throw new Error('Message not found');
  }

  // Add user to deletedBy array
  if (!message.deletedBy.includes(userId)) {
    message.deletedBy.push(userId);
  }

  // If both users have deleted, mark as fully deleted
  if (message.deletedBy.length >= 2) {
    message.isDeleted = true;
  }

  return message.save();
};

/**
 * Search messages
 * @param {ObjectId} userId - User ID
 * @param {String} searchTerm - Search term
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of matching messages
 */
MessageSchema.statics.searchMessages = async function(userId, searchTerm, options = {}) {
  const { limit = 20, skip = 0 } = options;

  return this.find({
    $or: [
      { from: userId },
      { dest: userId },
    ],
    msg: { $regex: searchTerm, $options: 'i' },
    isDeleted: false,
  })
    .populate('from', 'name email')
    .populate('dest', 'name email')
    .sort({ time: -1 })
    .limit(limit)
    .skip(skip)
    .lean()
    .exec();
};

/**
 * Instance Methods
 */

/**
 * Mark this message as read
 * @returns {Promise<Message>} Updated message
 */
MessageSchema.methods.markRead = async function() {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
  }
  return this;
};

/**
 * Get the other user in the conversation
 * @param {ObjectId} currentUserId - Current user's ID
 * @returns {ObjectId} Other user's ID
 */
MessageSchema.methods.getOtherUser = function(currentUserId) {
  return this.from.toString() === currentUserId.toString() 
    ? this.dest 
    : this.from;
};

/**
 * Query Helpers
 */

/**
 * Filter unread messages
 */
MessageSchema.query.unread = function() {
  return this.where({ isRead: false });
};

/**
 * Filter by recipient
 */
MessageSchema.query.toUser = function(userId) {
  return this.where({ dest: userId });
};

/**
 * Filter by sender
 */
MessageSchema.query.fromUser = function(userId) {
  return this.where({ from: userId });
};

/**
 * Filter active (not deleted) messages
 */
MessageSchema.query.active = function() {
  return this.where({ isDeleted: false });
};

/**
 * Create and export model
 */
const Message = mongoose.model('Message', MessageSchema);

module.exports = Message;