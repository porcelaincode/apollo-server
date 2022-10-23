// auth
const usersResolvers = require("./auth/users");

// retail
const storeResolvers = require("./retail/stores");
const orderResolvers = require("./retail/orders");
const productResolvers = require("./retail/products");

module.exports = {
  Query: {
    ...usersResolvers.Query,
    ...orderResolvers.Query,
    ...storeResolvers.Query,
    ...productResolvers.Query,
  },
  Mutation: {
    ...usersResolvers.Mutation,
    ...orderResolvers.Mutation,
    ...storeResolvers.Mutation,
    ...productResolvers.Mutation,
  },
  Subscription: {
    ...usersResolvers.Subscriptions,
    ...orderResolvers.Subscriptions,
    ...storeResolvers.Subscriptions,
  },
};
