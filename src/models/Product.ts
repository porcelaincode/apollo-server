import mongoose from "mongoose";

mongoose.Promise = global.Promise;

const skuSchema = new mongoose.Schema({
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
  fetchUri: {
    type: String,
  },
  quantity: {
    count: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
  },
  barcode: {
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
  ratings: {
    type: [Number],
  },
});

const productSchema = new mongoose.Schema({
  brand: {
    type: String,
  },
  name: {
    type: String,
    required: true,
  },
  skus: [skuSchema],
});

module.exports =
  mongoose.models.Product || mongoose.model("Product", productSchema);
