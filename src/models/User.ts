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

const deliverySchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    line1: {
      type: String,
    },
    location: {
      type: pointSchema,
      required: true,
    },
  },
  { _id: true }
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

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    min: 3,
    max: 255,
  },
  contact: {
    type: contactSchema,
    required: true,
  },
  addressBook: [deliverySchema],
  meta: {
    lastLogin: {
      type: String,
      requried: true,
    },
    loginCount: {
      type: Number,
      requried: true,
    },
    createdAt: {
      type: String,
      requried: true,
    },
  },
});

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
