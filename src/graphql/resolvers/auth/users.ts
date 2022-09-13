import {
  ContactProps,
  EditProfileProps,
  RegisterProps,
  TwilioMessageProps,
  UpdateAddressProps,
} from "../../../props";
const Geohash = require("../../../geohash");

const mongoose = require("mongoose");
const { withFilter } = require("graphql-subscriptions");
const {
  UserInputError,
  AuthenticationError,
} = require("apollo-server-express");

const {
  validateRegisterInput,
  validateLoginInput,
} = require("../../../utils/validators");

const User = mongoose.model.User || require("../../../models/User");
const Store = mongoose.model.Store || require("../../../models/Store");

const checkAuth = require("../../../utils/checkAuth");
const {
  generateOTP,
  generateRefreshToken,
  generateToken,
  addMinutesToDate,
} = require("../../../utils/generalUtil");
const { findNearbyStores } = require("../../../brain");
const { twclient } = require("../../../twilio");
const { client, pubsub } = require("../../../redis");

require("dotenv").config();

const messagingServiceSid = process.env.TWILIO_MESSAGING_SID;

const USER_UPDATE = "USER_UPDATE";
const STORE_UPDATE = "STORE_UPDATE";

module.exports = {
  Query: {
    async getFeed(
      _: any,
      { coordinates }: { coordinates: [string, string] },
      req
    ) {
      // const { loggedUser } = checkAuth(req);

      const data = {
        store: {
          id: null,
          available: false,
        },
      };

      if (coordinates) {
        const geohash = Geohash.encode(
          parseFloat(coordinates[0]),
          parseFloat(coordinates[1]),
          9
        );

        const nearbyStores = await findNearbyStores(geohash);

        if (nearbyStores[0]) {
          const store = await Store.findById(nearbyStores[0]);
          data.store.available = store.meta.closed;
          data.store.id = store.id;
        }
      }

      return data;
    },
    async getUser(_: any, {}, req) {
      const { loggedUser } = checkAuth(req);

      const user = await User.findById(loggedUser.id);

      if (user) {
        return user;
      } else {
        throw new Error("User not found");
      }
    },
    async twoFactorAuth(
      _: any,
      { contact, newAcc }: { contact: ContactProps; newAcc: boolean }
    ) {
      if (contact.number.length !== 10) {
        return {
          date: null,
          error: true,
          message: "Contact number provided not valid.",
        };
      }

      const user = await User.findOne({
        "contact.number": contact.number,
      });

      if (user && newAcc) {
        return {
          date: null,
          error: true,
          message: "Account with this contact number already exists.",
        };
      }

      if (user || newAcc) {
        await client.get(contact.number).then(async (res: any) => {
          if (res) {
            await client.del(contact.number).then(() => {
              console.log(`Deleted auth code for ${contact.number}...`);
            });
          }
        });

        const otp = generateOTP(6);

        client.set(contact.number, otp).then((res: any) => {
          if (res) {
            client.expire(contact.number, 1.5 * 60);
          }
        });
        console.log(`${contact.number}:${otp} will expire in 1 mins`);

        const expiresIn = addMinutesToDate(Date.now(), 1);
        // send req to twillio server with 10 second lag
        if (process.env.NODE_ENV === "production") {
          twclient.messages
            .create({
              body: `<#> ${otp} is your locality verification code. It expires in about 1 minute.`,
              messagingServiceSid,
              to: `${contact.ISD}${contact.number}`,
            })
            .then((message: TwilioMessageProps) => console.log(message.sid))
            .done();
        }

        return {
          date: expiresIn,
          error: false,
          message: "",
        };
      } else {
        if (!user) {
          return {
            date: null,
            error: true,
            message: "Account with this contact does not exist.",
          };
        } else {
          return {
            date: null,
            error: true,
            message: "Error logging in! Try again in some time.",
          };
        }
      }
    },
    async checkAuth(
      _: any,
      { contact, secureCode }: { contact: ContactProps; secureCode: string }
    ) {
      // get value from redis server
      const codeToCheck = await client.get(contact.number);

      if (codeToCheck === secureCode) {
        client.del(contact.number);
        return { error: false, errorMsg: "", status: true };
      } else {
        return {
          error: true,
          errorMsg: "Code does not match! Try again",
          status: false,
        };
      }
    },
  },
  Mutation: {
    async login(_: any, { contact }: { contact: ContactProps }, req) {
      const { source } = checkAuth(req, true);

      console.log(`Login request recieved from ${contact.number}`);

      const { errors, valid } = validateLoginInput(contact);

      if (!valid) {
        throw new UserInputError("Errors", { errors });
      }

      if (source.startsWith("locale-store")) {
        const store = await Store.findOne({
          "contact.number": contact.number,
        });

        if (!store) {
          errors.general = "Store not found";
          throw new UserInputError("Store not found", { errors });
        }

        const token = generateToken(store);
        const refreshToken = generateRefreshToken(store);

        pubsub.publish(STORE_UPDATE, {
          userUpdate: {
            ...store._doc,
            id: store._id,
            token,
            refreshToken,
          },
        });

        return {
          ...store._doc,
          id: store._id,
          token,
          refreshToken,
        };
      } else if (source.startsWith("locale-user")) {
        const user = await User.findOne({
          "contact.number": contact.number,
        });

        if (!user) {
          errors.general = "User not found";
          throw new UserInputError("User not found", { errors });
        }

        const token = generateToken(user);
        const refreshToken = generateRefreshToken(user);

        pubsub.publish(USER_UPDATE, {
          userUpdate: {
            ...user._doc,
            id: user._id,
            token,
            refreshToken,
          },
        });

        return {
          ...user._doc,
          id: user._id,
          token,
          refreshToken,
        };
      } else {
        errors.general = "User not found";
        throw new AuthenticationError("Login not authorised.", {
          errors,
        });
      }
    },
    async register(
      _: any,
      { userInfoInput }: { userInfoInput: RegisterProps },
      req
    ) {
      // validate user data
      const { valid, errors } = validateRegisterInput(userInfoInput.contact);

      if (!valid) {
        throw new UserInputError("Errors", { errors });
      }

      const user_ = await User.findOne({
        "contact.number": userInfoInput.contact.number,
      });

      if (user_) {
        throw new UserInputError("Contact is taken", {
          errors: {
            contact: "This contact is taken",
          },
        });
      }

      // hash the password and create auth token
      // password = await bcrypt.hash(contact, 12);

      const newUser = new User({
        ...userInfoInput,
        meta: {
          createdAt: new Date().toISOString(),
        },
      });

      const res = await newUser.save();

      console.log(`User ${res._id} registered.`);

      const token = generateToken(res);
      const refreshToken = generateRefreshToken(res);

      pubsub.publish(USER_UPDATE, {
        userUpdate: {
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
    },
    async deleteAccount(_: any, {}, req: any) {
      const { loggedUser, source } = checkAuth(req);

      const id = source.split("-")[2];

      if (source.startsWith("locale-store")) {
        const storeDeleted = await Store.deleteOne({
          _id: id,
        });

        return storeDeleted.deletedCount ? true : false;
      } else if (source.startsWith("locale-user")) {
        const userDeleted = await User.deleteOne({
          _id: loggedUser.id,
        });

        return userDeleted.deletedCount ? true : false;
      } else {
        throw new AuthenticationError("Action not authorized");
      }
    },
    async updateAddress(
      _: any,
      { id, addressInfo }: { id?: string; addressInfo: UpdateAddressProps },
      req: any
    ) {
      const { loggedUser } = checkAuth(req);

      let user_;
      if (id) {
        const geohash = Geohash.encode(
          Number(addressInfo.location.coordinates[0]),
          Number(addressInfo.location.coordinates[1]),
          9
        );

        // find nearby stores with geohashed string
        // const nearbyStores = findNearbyStores(geohash);

        user_ = await User.updateOne(
          { _id: loggedUser.id, "deliveryAddresses._id": id },
          {
            $set: {
              "deliveryAddresses.$": {
                ...addressInfo,
                location: {
                  hash: geohash,
                  coordinates: addressInfo.location.coordinates,
                },
              },
            },
          }
        );
      } else {
        const geohash = Geohash.encode(
          Number(addressInfo.location.coordinates[0]),
          Number(addressInfo.location.coordinates[1]),
          9
        );

        // const nearbyStores = await findNearbyStores(geohash);

        user_ = await User.updateOne(
          { _id: loggedUser.id },
          {
            $push: {
              deliveryAddresses: {
                ...addressInfo,
                location: {
                  hash: geohash,
                  ...addressInfo.location,
                },
              },
            },
          }
        );
      }

      const res = await User.findById(loggedUser.id);

      pubsub.publish(USER_UPDATE, {
        userUpdate: {
          ...res._doc,
          id: res._id,
        },
      });

      return user_.modifiedCount ? true : false;
    },
    async deleteAddress(_: any, { id }: { id: string }, req: any) {
      const { loggedUser } = checkAuth(req);

      const user = await User.findById(loggedUser.id);

      const deliveryAddresses = [...user.deliveryAddresses];

      const i = deliveryAddresses.findIndex((e) => e._id.toString() === id);

      if (i <= -1) {
        deliveryAddresses.splice(i, 1);

        const user_ = await User.updateOne(
          { _id: loggedUser.id },
          {
            deliveryAddresses,
          }
        );

        pubsub.publish(USER_UPDATE, {
          userUpdate: {
            ...user._doc,
            id: user._id,
            deliveryAddresses,
          },
        });

        return user_.nModified ? true : false;
      } else {
        return false;
      }
    },
    async editProfile(
      _: any,
      { editProfileInput }: { editProfileInput: EditProfileProps },
      req: any
    ) {
      const { loggedUser } = checkAuth(req);

      const user_ = await User.updateOne(
        { _id: loggedUser.id },
        {
          $set: {
            name: editProfileInput.name,
            contact: editProfileInput.contact,
          },
        }
      );

      pubsub.publish(USER_UPDATE, {
        userUpdate: {
          ...user_._doc,
          id: user_._id,
          name: editProfileInput.name,
          contact: editProfileInput.contact,
        },
      });

      return user_.nModified ? true : false;
    },
  },
  Subscriptions: {
    userUpdate: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([USER_UPDATE]),
        (payload: any, variables: any) => {
          return payload.id === variables.id;
        }
      ),
    },
  },
};
