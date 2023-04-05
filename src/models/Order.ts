import mongoose from "mongoose";

mongoose.Promise = global.Promise;

export const pointSchema = new mongoose.Schema(
  {
    hash: {
      type: String,
      required: true,
    },
    coordinates: {
      type: [String],
      required: true,
    },
  },
  { _id: true }
);

const orderProductSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
    },
    name: {
      type: String,
      required: true,
    },
    url: {
      type: String,
    },
    price: {
      mrp: {
        type: String,
        required: true,
      },
      discount: {
        type: String,
      },
    },
    quantity: {
      units: {
        type: String,
        required: true,
        default: 1,
      },
      count: {
        type: String,
      },
      type: {
        type: String,
      },
    },
    totalAmount: {
      type: String,
      required: true,
    },
  },
  {
    _id: false,
  }
);

const orderSchema = new mongoose.Schema({
  meta: {
    userId: {
      type: String,
    },
    storeId: {
      type: String,
      required: true,
    },
    rating: {
      type: String,
      required: false,
    },
    timeTaken: {
      type: String,
      required: false,
    },
  },
  products: [orderProductSchema],
  linkedAccount: {
    type: String,
  },
  state: {
    created: {
      date: {
        type: String,
        required: true,
      },
    },
    message: {
      type: String,
      default: "Order processing",
    },
    order: {
      cancelled: {
        type: Boolean,
        default: false,
      },
      accepted: {
        type: Boolean,
        default: false,
      },
      date: {
        type: String,
      },
    },
    delivery: {
      toDeliver: {
        type: Boolean,
        required: true,
      },
      address: {
        line: {
          type: String,
        },
        location: {
          type: pointSchema,
        },
      },
      deliverBy: {
        type: String,
      },
      delivered: {
        type: Boolean,
        default: false,
      },
      deliveredAt: {
        type: String,
      },
      dispatched: {
        type: Boolean,
        default: false,
      },
      dispatchedAt: {
        type: String,
      },
    },
    payment: {
      method: {
        type: String,
      },
      paid: {
        type: Boolean,
      },
      paymentId: {
        type: String,
      },
      grandAmount: {
        type: String,
        required: true,
      },
      paidAt: {
        type: String,
      },
    },
  },
});

module.exports = mongoose.models.Order || mongoose.model("Order", orderSchema);
