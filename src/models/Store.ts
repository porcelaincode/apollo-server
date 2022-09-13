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
  { _id: false }
);

export const contactSchema = new mongoose.Schema(
  {
    ISD: {
      type: String,
      min: 1,
      max: 4,
    },
    number: {
      type: String,
      required: true,
      min: 10,
      max: 12,
    },
  },
  { _id: false }
);

const accountOrderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
    },
    paid: {
      type: Boolean,
    },
    date: {
      type: String,
    },
    amount: {
      type: String,
    },
  },
  {
    _id: false,
  }
);

const accountPendingSchema = new mongoose.Schema(
  {
    status: {
      type: Boolean,
      default: true,
    },
    amount: {
      type: String,
    },
  },
  { _id: false }
);

const accountSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
    },
    lastUpdated: {
      type: String,
    },
    closed: {
      type: Boolean,
    },
    orders: {
      type: [accountOrderSchema],
    },
    pending: {
      type: accountPendingSchema,
    },
  },
  {
    _id: false,
  }
);

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  contact: {
    type: contactSchema,
    required: true,
  },
  meta: {
    verified: {
      type: Boolean,
      default: false,
    },
    closed: {
      type: Boolean,
      default: false,
    },
  },
  address: {
    line: {
      type: String,
    },
    location: {
      type: pointSchema,
      required: true,
    },
  },
  accounts: {
    type: [accountSchema],
  },
});

module.exports = mongoose.models.Store || mongoose.model("Store", storeSchema);
