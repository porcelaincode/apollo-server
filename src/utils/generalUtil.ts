import jwt from 'jsonwebtoken';
import { Document } from 'mongoose';

import { IContactSchema, IProductSchema } from '../types';

async function asyncForEach(array: any[], callback: any) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

function log(str: string) {
    if (process.env.NODE_ENV === 'production') {
        console.log(str);
    }
}

function generateOTP(n: number): string {
    let add = 1,
        max = 12 - add; // 12 is the min safe number Math.random() can generate without it starting to pad the end with zeros.
    let data: string;
    if (n > max) {
        return generateOTP(max) + generateOTP(n - max);
    }

    max = Math.pow(10, n + add);
    const min = max / 10; // Math.pow(10, n) basically
    const number = Math.floor(Math.random() * (max - min + 1)) + min;
    data = ('' + number).substring(add);
    return data;
}

export interface IUserTokenSchema extends Document {
    id?: string;
    name?: string;
    contact: IContactSchema;
}

function generateToken(user: IUserTokenSchema) {
    return jwt.sign(
        {
            id: user._id,
            name: user.name,
            contact: user.contact,
        },
        process.env.TOKEN_SECRET,
        { expiresIn: '7d' },
    );
}

function generateRefreshToken(user: IUserTokenSchema) {
    return jwt.sign(
        {
            id: user.id,
            contact: user.contact,
        },
        process.env.REFRESH_TOKEN_SECRET,
    );
}

function addMinutesToDate(objDate: number, intMinutes: number) {
    const numberOfMlSeconds = objDate;
    const addMlSeconds = intMinutes * 60000;
    const newDateObj = new Date(numberOfMlSeconds + addMlSeconds).toISOString();
    return newDateObj;
}

function randomizeArray(array: Array<IProductSchema>, lim: number) {
    const c = [...array];
    const len = array.length;

    if (lim) {
        c.slice(0, lim);
    }

    return c;
}

export { log, asyncForEach, generateToken, generateOTP, generateRefreshToken, addMinutesToDate, randomizeArray };
