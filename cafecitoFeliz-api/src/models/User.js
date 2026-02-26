const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: { type: String, required: true },

    role: {
      type: String,
      enum: ['admin', 'cashier'],
      default: 'cashier',
      index: true,
    },

    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

userSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;

    delete ret.passwordHash;
  },
});

module.exports = mongoose.model('User', userSchema);