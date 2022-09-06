// auth
const userTypes = require("./auth/users");

// retail
const productTypes = require("./retail/products");
const orderTypes = require("./retail/orders");
const storeTypes = require("./retail/stores");

module.exports = [userTypes, orderTypes, storeTypes, productTypes];
