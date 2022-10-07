const mongoose = require("mongoose");
import { UserInputError } from "apollo-server-express";

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
      { name, limit }: { name: string; limit: number },
      req
    ) {
      const { loggedUser, source } = checkAuth(req);

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
        console.log(`${loggedUser.id} looked up ${name}`);
        return products;
      } else {
        console.log(`${loggedUser.id} couldn't find ${name}`);
        throw new UserInputError("No Products not found");
      }
    },
  },
  Mutation: {
    async addToInventory(_, { productInfo }, req) {
      const { loggedUser, source } = checkAuth(req);

      if (source.startsWith("locale-store")) {
        const data = [...productInfo];

        await asyncForEach(data, async (p: any) => {
          if (p.id) {
            const product = await Product.findById(p.id);
          }
        });

        const res = await Inventory.findOne({ "meta.storeId": loggedUser.id });

        pubsub.publish(INVENTORY_UPDATE, {
          storeUpdate: {
            ...res._doc,
            id: res._id,
          },
        });
      }

      throw new Error("User not authorised to access this route.");
    },
  },
};
