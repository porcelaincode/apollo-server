const mongoose = require("mongoose");
const bson = require("bson");
const { AuthenticationError } = require("apollo-server-express");

import { UserInputError } from "apollo-server-express";
import { ProductProps } from "../../../props";

const Product = mongoose.model.Product || require("../../../models/Product");
const Inventory =
  mongoose.model.Inventory || require("../../../models/Inventory");

const checkAuth = require("../../../utils/checkAuth");

const checkName = (name, str) => {
  var pattern = str
    .split("")
    .map((x) => {
      return `(?=.*${x})`;
    })
    .join("");
  var regex = new RegExp(`${pattern}`, "g");
  return name.match(regex);
};

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
      const { source } = checkAuth(req, true);

      if (source.startsWith("locale-store")) {
        // check if product exists in store
        const inventory = await Inventory.findOne({ "meta.storeId": storeId });

        const p = [...inventory.products].find((e) => e.barcode === barcode);

        if (p) {
          return {
            product: p,
            inStore: true,
          };
        } else {
          const product = await Product.findOne({ barcode });
          return {
            product: {
              ...product._doc,
              id: product._id,
            },
            inStore: false,
          };
        }
      } else if (source.startsWith("locale-user")) {
        throw new Error("User not authorized to acces this route");
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
        console.log(
          `${loggedUser.id} looked up ${name} in Store${
            storeId ? " " + storeId : ""
          }`
        );

        if (source.startsWith("locale-store")) {
          const inventory = await Inventory.findOne({
            "meta.storeId": loggedUser.id,
          });

          products.forEach((p, index) => {
            var i = inventory.products.findIndex((e) => e.id === p.id);
            if (i > -1) {
              var product = inventory._doc.products[i];
              products[index] = {
                ...p._doc,
                id: p.id,
                quantity: {
                  ...product.quantity,
                  units: product.quantity.units || 0,
                },
              };
            }
          });
        }

        return products;
      } else {
        console.log(
          `${loggedUser.id} couldn't find ${name} in Store${
            storeId ? " " + storeId : ""
          }`
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

      const inventory = await Inventory.findOne({ "meta.storeId": storeId });

      var products = [...inventory.products].filter((x) => {
        return checkName(x.name, name);
      });

      if (inventory) {
        console.log(`${loggedUser.id} looked up ${name} in Store ${storeId}`);
        return { ...inventory._doc, products };
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
      const { loggedUser, source } = checkAuth(req);

      if (product.id) {
        const p = await Product.findById(product.id);

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
      } else {
        delete product.id;

        const p = new Product({
          ...product,
        });

        const res = await p.save();

        return {
          ...res._doc,
          id: res._id,
        };
      }
    },
  },
};
