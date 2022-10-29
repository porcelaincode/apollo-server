const mongoose = require("mongoose");
const bson = require("bson");

import { UserInputError, ValidationError } from "apollo-server-express";
import e = require("express");
import { withFilter } from "graphql-subscriptions";

import { ContactProps, ProductProps, StoreInfoProps } from "../../../props";

const Store = mongoose.model.Store || require("../../../models/Store");
const Order = mongoose.model.Order || require("../../../models/Order");
const Product = mongoose.model.Product || require("../../../models/Product");
const Inventory =
  mongoose.model.Inventory || require("../../../models/Inventory");

const checkAuth = require("../../../utils/checkAuth");
const { asyncForEach } = require("../../../utils/generalUtil");
const Geohash = require("../../../geohash");
const pubsub = require("../../../pubsub");

const {
  generateToken,
  generateRefreshToken,
} = require("../../../utils/generalUtil");

const STORE_UPDATE = "STORE_UPDATE";
const INVENTORY_UPDATE = "INVENTORY_UPDATE";

module.exports = {
  Query: {
    async getStore(_: any, {}, req) {
      const { loggedUser, source } = checkAuth(req);

      const store = await Store.findById(loggedUser.id);

      console.log(`Store ${loggedUser.id} requesting details.`);

      // process data
      const td = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();

      const orders = await Order.find({
        "meta.storeId": store._id,
        "state.created.date": {
          $gte: td,
        },
      });

      var total = 0;
      var count = 0;

      orders.forEach((obj: any) => {
        if (obj.state.order.accepted) {
          count = count + 1;
          total = total + parseFloat(obj.state.payment.grandAmount);
        }
      });

      const stat = {
        amount: total.toFixed(2).toString(),
        count: count,
        error: false,
        errorMessage: null,
      };

      if (store) {
        return { ...store._doc, id: store._id, stat };
      } else {
        throw new ValidationError("User not found");
      }
    },
    async getConfirmation(_: any, { storeId }: { storeId: string }, req) {
      const { loggedUser, source } = checkAuth(req);

      console.log(`User ${loggedUser.id} requesting confirmation for order.`);

      var data = {
        name: "",
        status: {
          closed: true,
        },
        account: {
          exists: false,
          amount: "0.00",
          closed: false,
          date: new Date().toISOString(),
        },
      };

      const store = await Store.findById(storeId);

      data.name = store._doc.name;
      data.status.closed = store._doc.meta.closed;

      const account = store._doc.accounts.find(
        (account: any) => account.id === loggedUser.id
      );

      if (account) {
        data.account.exists = true;
        data.account.amount = account.pending.amount;
        data.account.closed = account.closed;
        data.account.date = account.lastUpdated;
      }

      return data;
    },
  },
  Mutation: {
    async addAccount(
      _,
      { contact, orderId }: { contact: ContactProps; orderId: string },
      req
    ) {
      const { loggedUser, source } = checkAuth(req);

      if (source.startsWith("locale-store")) {
        const account = await Store.findOne({
          "accounts.$.contact": contact,
        });

        if (account) {
          console.log("Account exists.");
        } else {
          console.log("Creating account.");
        }
      } else {
        throw new Error("User not authenticated to access this path");
      }
    },
    async editStore(
      _: any,
      { edit, storeInfo }: { edit: boolean; storeInfo: StoreInfoProps },
      req
    ) {
      const data = { ...storeInfo };

      const geohash = Geohash.encode(
        Number(data.address.location.coordinates[0]),
        Number(data.address.location.coordinates[1]),
        9
      );

      try {
        if (edit) {
          const { loggedUser, source } = checkAuth(req);

          console.log(`Store ${loggedUser.id} changing details.`);

          const storeUpdate = await Store.updateOne(
            { _id: bson.ObjectId(loggedUser.id) },
            {
              $set: {
                name: data.name,
                contact: data.contact,
                "meta.lastUpdated": new Date().toISOString(),
                address: {
                  line: data.address.line1,
                  location: {
                    hash: geohash,
                    coordinates: data.address.location.coordinates,
                  },
                },
              },
            }
          );

          if (storeUpdate.modifiedCount) {
            const res = await Store.findById(loggedUser.id);
            pubsub.publish(STORE_UPDATE, {
              storeUpdate: {
                ...res._doc,
                id: res._id,
              },
            });

            return {
              ...res._doc,
              id: res._id,
            };
          }
        } else {
          const { source } = checkAuth(req, true);

          const storeExists = await Store.findOne({
            "contact.number": data.contact.number,
          });

          if (storeExists) {
            throw new UserInputError("Contact is taken", {
              errors: {
                contact: "This contact is taken",
              },
            });
          }

          const newStore = new Store({
            ...data,
            address: {
              line: data.address.line1,
              location: {
                hash: geohash,
                coordinates: data.address.location.coordinates,
              },
            },
          });

          const res = await newStore.save();

          const newInventory = new Inventory({
            meta: {
              storeId: res._id,
              lastUpdated: new Date().toISOString(),
            },
            products: [],
          });
          const resInv = await newInventory.save();

          console.log(
            `Store ${res._id} registered. Inventory ${resInv._id} assigned.`
          );

          const token = generateToken(res);
          const refreshToken = generateRefreshToken(res);

          return {
            ...res._doc,
            id: res._id,
            token,
            refreshToken,
          };
        }
      } catch (err) {
        throw err;
      }
    },
    async addToInventory(
      _,
      { products }: { products: Array<ProductProps> },
      req
    ) {
      const { loggedUser, source } = checkAuth(req);

      if (source.startsWith("locale-store")) {
        const inventory = await Inventory.findOne({
          "meta.storeId": loggedUser.id,
        });

        const inventoryProducts = [...inventory.products];

        await asyncForEach(products, async (product) => {
          const inArray = inventoryProducts.findIndex(
            (p) => p.id === product.id
          );

          const p = await Product.findById(product.id);

          if (inArray >= -1) {
            inventoryProducts.splice(inArray, 1);
          }

          if (product.barcode && p.barcode.trim().length === 0) {
            await Product.updateOne(
              { _id: bson.ObjectId(product.id) },
              {
                $set: {
                  barcode: product.barcode,
                },
              }
            );
          }

          delete p._doc._id;
          delete p._doc.ratings;
          delete product.url;

          inventoryProducts.push({
            ...p._doc,
            ...product,
          });
        });

        const updated = await Inventory.updateOne(
          {
            "meta.storeId": loggedUser.id,
          },
          {
            $set: {
              "meta.lastUpdated": new Date().toISOString(),
              products: inventoryProducts,
            },
          }
        );

        await Store.updateOne(
          {
            _id: bson.ObjectId(loggedUser.id),
          },
          {
            $set: {
              "meta.lastUpdated": new Date().toISOString(),
            },
          }
        );

        pubsub.publish(INVENTORY_UPDATE, {
          inventoryUpdate: {
            ...inventory._doc,
            id: inventory._id,
            meta: {
              lastUpdated: new Date().toISOString(),
            },
            products: inventoryProducts,
          },
        });

        return updated.modifiedCount ? true : false;
      }

      throw new AuthenticationError("User cannot access this route.");
    },
  },
  Subscriptions: {
    storeUpdate: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([STORE_UPDATE]),
        (payload: any, variables: any) => {
          return payload.storeUpdate.id === variables.id;
        }
      ),
    },
    inventoryUpdate: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([INVENTORY_UPDATE]),
        (payload: any, variables: any) => {
          return payload.inventoryUpdate.id === variables.id;
        }
      ),
    },
  },
};
