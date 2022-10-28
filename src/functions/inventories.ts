const mongoose = require("mongoose");

const Inventory = mongoose.model.Inventory || require("../models/Inventory");
const Product = mongoose.model.Product || require("../models/Product");

const { asyncForEach } = require("../utils/generalUtil");

import { OrderProductProps } from "../props";

export async function updateInventory(products, storeId) {
  const inventory = await Inventory.findOne({
    "meta.storeId": storeId,
  });

  let inventoryProducts = [...inventory.products];
  let newProducts = [];

  await asyncForEach(products, async (product: OrderProductProps) => {
    let i = inventoryProducts.findIndex((p) => p.id === product.id);

    if (i <= -1) {
      const p = await Product.findById(product.id);
      newProducts.push(p);
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
