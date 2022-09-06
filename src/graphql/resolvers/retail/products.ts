const mongoose = require("mongoose");
import { UserInputError } from "apollo-server-express";
const Product = mongoose.model.Product || require("../../../models/Product");

const checkAuth = require("../../../utils/checkAuth");

module.exports = {
  Query: {
    async getProduct(_: any, { id }: { id: string }, req) {
      // const { loggedUser, source } = checkAuth(req);

      const product = await Product.findById(id);

      if (product) {
        // console.log(`${loggedUser.id} looked up ${product._doc.name}`);
        return product;
      } else {
        // console.log(`${loggedUser.id} couldn't find product id: ${id}`);
        throw new UserInputError("Product not found");
      }
    },
    async getProducts(
      _: any,
      { name, limit }: { name: string; limit: number },
      req
    ) {
      // const { loggedUser, source } = checkAuth(req);

      let products = [];

      if (limit) {
        products = await Product.find({
          name: {
            $regex: "^" + name,
            $options: "i",
          },
        }).limit(limit);
      } else {
        products = await Product.find({
          name: {
            $regex: "^" + name,
            $options: "i",
          },
        });
      }

      if (products) {
        // console.log(`${loggedUser.id} looked up ${name}`);
        return products;
      } else {
        // console.log(`${loggedUser.id} couldn't find ${name}`);
        throw new UserInputError("No Products not found");
      }
    },
  },
};
