const mongoose = require("mongoose");
const bson = require("bson");

import { UserInputError } from "apollo-server-express";
import { ProductProps } from "../../../props";

const Product = mongoose.model.Product || require("../../../models/Product");
const Store = mongoose.model.Store || require("../../../models/Store");
const Inventory =
  mongoose.model.Inventory || require("../../../models/Inventory");

const checkAuth = require("../../../utils/checkAuth");
const pubsub = require("../../../pubsub");
const { asyncForEach } = require("../../../utils/generalUtil");

const INVENTORY_UPDATE = "INVENTORY_UPDATE";

module.exports = {
  Query: {
    async getInventory(_, {}, req) {
      const { loggedUser, source } = checkAuth(req);

      if (source.startsWith("locale-store")) {
        const inventory = await Inventory.findOne({
          "meta.storeId": loggedUser.id,
        });

        return {
          ...inventory._doc,
          id: inventory._id,
        };
      }
      throw new AuthenticationError(
        "User not authorized to access this route."
      );
    },
    async getProduct(
      _: any,
      { storeId, barcode }: { storeId: string; barcode: string },
      req
    ) {
      const { loggedUser, source } = checkAuth(req);

      const inStore = false;

      if (source.startsWith("locale-store")) {
        // check if product exists in store
        const product = await Store;
      }

      throw new Error(
        "Product doesn't exist with us, register the new product."
      );
    },
    async getProducts(
      _: any,
      {
        name,
        limit,
        storeId,
      }: { name: string; limit: number; storeId: string },
      req
    ) {
      const { loggedUser, source } = checkAuth(req);

      let products: Array<ProductProps>;
      products = await Product.find({
        name: {
          $regex: "^" + name,
          $options: "i",
        },
      }).limit(limit ? limit : 10000);

      if (products) {
        console.log(`${loggedUser.id} looked up ${name} in Store ${storeId}`);
        return products;
      } else {
        console.log(
          `${loggedUser.id} couldn't find ${name} in Store ${storeId}`
        );
        throw new UserInputError("No Products not found");
      }
    },
    async getProductsFromStore(
      _: any,
      {
        name,
        limit,
        storeId,
      }: { name: string; limit: number; storeId: string },
      req
    ) {
      const { loggedUser, source } = checkAuth(req);

      const inventory = await Inventory.aggregate([
        {
          $match: {
            "meta.storeId": storeId,
            products: {
              $elemMatch: {
                $and: [
                  {
                    name: {
                      $regex: "^" + name,
                      $options: "i",
                    },
                  },
                ],
              },
            },
          },
        },
        {
          $project: {
            products: {
              $filter: {
                input: "$products",
                as: "product",
                cond: {
                  $eq: [
                    "$product.name",
                    {
                      $regex: "^" + name,
                      $options: "i",
                    },
                  ],
                },
              },
            },
          },
        },
      ]).limit(limit);

      if (inventory) {
        console.log(`${loggedUser.id} looked up ${name} in Store ${storeId}`);
        return inventory;
      } else {
        console.log(
          `${loggedUser.id} couldn't find ${name} in Store ${storeId}`
        );
        throw new UserInputError("No Products not found");
      }
    },
  },
  Mutation: {
    async editProduct(_, { product }: { product: ProductProps }, req) {
      // const { loggedUser, source } = checkAuth(req);

      const p = await Product.findById(product.id);

      delete product.id;

      await Product.updateOne(
        { _id: bson.ObjectId(product.id) },
        {
          ...product,
        }
      );

      return {
        ...p._doc,
        ...product,
      };
    },
  },
};
