const mongoose = require("mongoose");
const bson = require("bson");

import { UserInputError, ValidationError } from "apollo-server-express";
import { withFilter } from "graphql-subscriptions";

import { ContactProps, StoreInfoProps } from "../../../props";

const Store = mongoose.model.Store || require("../../../models/Store");

const checkAuth = require("../../../utils/checkAuth");
const Geohash = require("../../../geohash");
const { pubsub } = require("../../../redis");
const {
  generateToken,
  generateRefreshToken,
} = require("../../../utils/generalUtil");

const STORE_UPDATE = "STORE_UPDATE";

module.exports = {
  Query: {
    async getStore(_: any, { id }: { id: string }, req) {
      const { loggedUser, source } = checkAuth(req);

      const store = await Store.findById(id);

      if (store) {
        return store;
      } else {
        throw new ValidationError("User not found");
      }
    },
  },
  Mutation: {
    async editStore(
      _: any,
      { id, storeInfo }: { id: string; storeInfo: StoreInfoProps },
      req
    ) {
      const data = { ...storeInfo };

      const geohash = Geohash.encode(
        Number(data.address.location.coordinates[0]),
        Number(data.address.location.coordinates[1]),
        9
      );

      try {
        if (id) {
          // const { loggedUser, source } = checkAuth(req);

          const storeUpdate = await Store.updateOne(
            { _id: bson.ObjectId(id) },
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
            const res = await Store.findById(id);
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
          // const { source } = checkAuth(req);

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
  Subscription: {
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
