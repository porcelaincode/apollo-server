import { Schema, Document, model } from 'mongoose';
import { IUserSchema } from '../types';

export interface IUser extends IUserSchema, Document {}

export const pointSchema = new Schema(
    {
        hash: {
            type: String,
            required: true,
        },
        coordinates: {
            type: [String],
            required: true,
        },
    },
    { _id: true },
);

const deliverySchema = new Schema(
    {
        name: {
            type: String,
        },
        line1: {
            type: String,
        },
        location: {
            type: pointSchema,
            required: true,
        },
    },
    { _id: true },
);

export const contactSchema = new Schema(
    {
        ISD: {
            type: String,
            min: 1,
            max: 4,
        },
        number: {
            type: String,
            required: true,
            min: 10,
            max: 12,
        },
    },
    { _id: false },
);

const userSchema = new Schema({
    name: {
        type: String,
        min: 3,
        max: 255,
    },
    contact: {
        type: contactSchema,
        required: true,
    },
    deliveryAddresses: [deliverySchema],
    meta: {
        lastLogin: {
            type: String,
            requried: true,
        },
        loginCount: {
            type: Number,
            requried: true,
        },
        createdAt: {
            type: String,
            requried: true,
        },
    },
});

export default model<IUser>('User', userSchema);
