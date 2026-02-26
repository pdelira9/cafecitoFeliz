const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100
    },
    price: {
      type: Number,
      required: true,
      min: 0.01
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'stock must be an integer'
      }
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

productSchema.index({ active: 1, createdAt: -1 });

productSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
  }
});

module.exports = mongoose.model('Product', productSchema);
