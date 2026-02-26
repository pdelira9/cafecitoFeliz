const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema(
  {

    saleId: { type: String, required: true, unique: true },


    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
    },


    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'transfer'],
      required: true,
      default: 'cash',
    },


    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        productNameSnapshot: { type: String },
        unitPriceSnapshot: { type: Number },
        quantity: { type: Number, required: true, min: 1 },
        lineTotal: { type: Number },
      },
    ],

    subtotal: { type: Number, required: true, min: 0 },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    discountAmount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },


    status: {
      type: String,
      enum: ['completed', 'canceled'],
      default: 'completed',
      index: true,
    },

    canceledAt: { type: Date, default: null },

    cancelReason: { type: String, default: '' },
  },
  { timestamps: true }
);

saleSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
  },
});

module.exports = mongoose.model('Sale', saleSchema);