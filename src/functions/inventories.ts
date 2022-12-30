const mongoose = require("mongoose");

const Inventory = mongoose.model.Inventory || require("../models/Inventory");
const Product = mongoose.model.Product || require("../models/Product");
const Order = mongoose.model.Order || require("../models/Order");

const { asyncForEach } = require("../utils/generalUtil");
const { randomizeArray } = require("../utils/generalUtil");

import { OrderProductProps, OrderProps, ProductProps } from "../props";

export async function updateInventory(
  products: Array<ProductProps>,
  storeId: string
) {
  const inventory = await Inventory.findOne({
    "meta.storeId": storeId,
  });

  let inventoryProducts = [...inventory.products];
  let newProducts = [];

  await asyncForEach(products, async (product: OrderProductProps) => {
    let i = inventoryProducts.findIndex((p) => p.id === product.id);

    if (i <= -1) {
      const p = await Product.findById(product.id);
      newProducts.push({
        ...p._doc,
        id: p._id.toString(),
        lastUpdated: new Date().toISOString(),
      });
    }
  });

  const res = await Inventory.updateOne(
    { "meta.storeId": storeId },
    {
      $set: {
        "meta.lastUpdated": new Date().toISOString(),
        products: [...newProducts, ...inventoryProducts],
      },
    }
  );

  return res.modifiedCount;
}

export async function getFeedProducts(userId: string, storeId: string) {
  let orders = await Order.find({
    "meta.storeId": storeId,
    "meta.userId": userId,
  })
    .limit(5)
    .sort({
      "state.created.date": -1,
    });

  let recentProducts: Array<OrderProductProps> = [];
  let alikeProducts: Array<ProductProps> = [];

  await asyncForEach(orders, async (order: OrderProps) => {
    order.products.forEach((product) => {
      let i = recentProducts.findIndex((e) => e.id === product.id);
      if (i <= -1) {
        recentProducts = [...recentProducts].concat(product);
      }
    });
  });

  var inventory = await Inventory.findOne({ "meta.storeId": storeId });
  if (inventory) {
    alikeProducts = randomizeArray([...inventory.products], 10);
  }

  return { recentProducts, alikeProducts };
}
