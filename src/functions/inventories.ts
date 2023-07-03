import Inventory from '../models/Inventory';
import Product from '../models/Product';
import Order from '../models/Order';

import { asyncForEach } from '../utils/generalUtil';
import { randomizeArray } from '../utils/generalUtil';

import { IOrderProductsSchema, IOrderSchema, IProductSchema } from '../types';

export async function updateInventory(products: Array<IOrderProductsSchema>, storeId: string) {
    const inventory = await Inventory.findOne({
        'meta.storeId': storeId,
    });

    const inventoryProducts = [...inventory.products];
    const newProducts = [];

    await asyncForEach(products, async (product: IOrderProductsSchema) => {
        const i = inventoryProducts.findIndex((p) => p.id === product.id);

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
        { 'meta.storeId': storeId },
        {
            $set: {
                'meta.lastUpdated': new Date().toISOString(),
                products: [...newProducts, ...inventoryProducts],
            },
        },
    );

    return res.modifiedCount;
}

export async function getFeedProducts(userId: string, storeId: string) {
    const orders = await Order.find({
        'meta.storeId': storeId,
        'meta.userId': userId,
    })
        .limit(5)
        .sort({
            'state.created.date': -1,
        });

    let recentProducts: Array<IOrderProductsSchema> = [];
    let alikeProducts: Array<IProductSchema> = [];

    await asyncForEach(orders, async (order: IOrderSchema) => {
        order.products.forEach((product) => {
            const i = recentProducts.findIndex((e) => e.id === product.id);
            if (i <= -1) {
                recentProducts = [...recentProducts].concat(product);
            }
        });
    });

    const inventory = await Inventory.findOne({ 'meta.storeId': storeId });
    if (inventory) {
        alikeProducts = randomizeArray([...inventory.products], 10);
    }

    return { recentProducts, alikeProducts };
}
