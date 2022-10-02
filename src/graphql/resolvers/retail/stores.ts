const mongoose = require("mongoose");
const bson = require("bson");

import { UserInputError, ValidationError } from "apollo-server-express";
import { withFilter } from "graphql-subscriptions";

import { StoreInfoProps } from "../../../props";

const Store = mongoose.model.Store || require("../../../models/Store");
const Order = mongoose.model.Order || require("../../../models/Order");

const checkAuth = require("../../../utils/checkAuth");
const Geohash = require("../../../geohash");
const pubsub = require("../../../pubsub");

const {
  generateToken,
  generateRefreshToken,
} = require("../../../utils/generalUtil");

const STORE_UPDATE = "STORE_UPDATE";

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

      console.log(stat);

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
    async editStore(
      _: any,
      { edit, storeInfo }: { edit: boolean; storeInfo: StoreInfoProps },
      req
    ) {
      const { loggedUser } = checkAuth(req);

      const data = { ...storeInfo };

      console.log(`Store ${loggedUser.id} changing details.`);

      const geohash = Geohash.encode(
        Number(data.address.location.coordinates[0]),
        Number(data.address.location.coordinates[1]),
        9
      );

      try {
        if (edit) {
          const { loggedUser, source } = checkAuth(req);

          const storeUpdate = await Store.updateOne(
            { _id: bson.ObjectId(loggedUser.id) },
            {
              $set: {
                name: data.name,
                contact: data.contact,
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
          console.log(`Store ${res._id} registered.`);

          const token = generateToken(res);
          const refreshToken = generateRefreshToken(res);

          pubsub.publish(STORE_UPDATE, {
            storeUpdate: {
              ...res._doc,
              id: res._id,
              token,
              refreshToken,
            },
          });

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
  },
  Subscriptions: {
    storeUpdate: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([STORE_UPDATE]),
        (payload: any, variables: any) => {
          return payload.id === variables.id;
        }
      ),
    },
  },
};
