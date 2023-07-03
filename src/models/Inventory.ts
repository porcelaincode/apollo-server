import { Schema, Document, model } from 'mongoose';
import { IInventorySchema } from '../types';

export interface IInventory extends IInventorySchema, Document {}

const inventoryProductSchema: Schema = new Schema(
    {
        id: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        url: {
            type: String,
        },
        barcode: {
            type: String,
        },
        quantity: {
            units: {
                type: Number,
                default: 0,
                required: true,
            },
            count: {
                type: String,
                required: true,
            },
            type: {
                type: String,
                required: true,
            },
        },
        price: {
            mrp: {
                type: String,
                required: true,
            },
            discount: {
                type: String,
            },
        },
        lastUpdated: {
            type: String,
            required: true,
        },
    },
    {
        _id: false,
    },
);

const inventorySchema: Schema = new Schema({
    meta: {
        storeId: {
            type: String,
            required: true,
        },
        lastUpdated: {
            type: String,
            required: true,
        },
    },
    products: {
        type: [inventoryProductSchema],
        default: [],
    },
});

export default model<IInventory>('Inventory', inventorySchema);
