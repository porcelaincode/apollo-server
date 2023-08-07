import { Document } from 'mongoose';

interface DocumentType<T> {
    _doc: T;
}

interface IProductPriceSchema {
    mrp: string;
    discount?: string;
}

interface IProductQuantitySchema {
    units: number;
    count: string;
    type: string;
}

interface IInventoryProductSchema {
    id: string;
    name: string;
    url?: string;
    barcode?: string;
    quantity: IProductQuantitySchema;
    price: IProductPriceSchema;
    lastUpdated: string;
}

export interface IInventorySchema {
    _doc: DocumentType;
    meta: {
        storeId: string;
        lastUpdated: string;
    };
    products: Array<IInventoryProductSchema>;
}

interface IPointSchema {
    hash: string;
    coordinates: [string, string];
}

interface IOrderProductsSchema {
    id: string;
    brand?: string;
    name: string;
    url: string;
    price: IProductPriceSchema;
    quantity: IProductQuantitySchema;
    totalAmount: string;
}

export interface IOrderSchema {
    _doc: DocumentType;
    meta: {
        userId?: string;
        storeId: string;
        rating?: string;
        timeTaken?: string;
    };
    products: Array<IOrderProductsSchema>;
    linkedAccount?: string;
    state: {
        created: {
            date: string;
        };
        message: string;
        order: {
            cancelled: boolean;
            accepteed: boolean;
            date: string;
        };
        delivery: {
            toDeliver: boolean;
            address: {
                line: string;
                location: IPointSchema;
            };
            deliverBy?: string;
            delivered?: boolean;
            deliveredAt?: string;
            dispatched?: boolean;
            dispatchedAt?: string;
        };
        payment: {
            method: string;
            paid: boolean;
            paymentId: string;
            grandAmount: string;
            paidAt: string;
        };
    };
}

export interface ICreateOrderSchema {
    products: Array<IOrderProductsSchema>;
    grandTotal?: string;
    addressId: string;
    storeId: string;
    paymentId?: string;
    delivery: boolean;
    deliverBy: string;
    accountId?: string;
    method?: string;
}

export interface IProductSchema {
    _doc?: DocumentType;
    id?: string;
    brand?: string;
    name: string;
    url?: string;
    fetchUri?: string;
    quantity: {
        count: string;
        type: string;
    };
    barcode: string;
    price: IProductPriceSchema;
    ratings?: Array<number>;
}

interface IContactSchema {
    ISD: string;
    number: string;
}

interface IAccountOrderSchema {
    orderId?: string;
    paid?: boolean;
    date?: string;
    amount?: string;
}

interface IAccountPendingSchema {
    status: boolean;
    amount?: string;
}

interface IAccountsSchema {
    id: string;
    name?: string;
    lastUpdated?: string;
    closed: boolean;
    orders: Array<IAccountOrderSchema>;
    pending: IAccountPendingSchema;
}

export interface IStoreSchema extends DocumentType {
    _doc: DocumentType;
    name?: string;
    contact: IContactSchema;
    meta: {
        verified: boolean;
        closed: boolean;
        lastUpdated: string;
    };
    upi: {
        value?: string;
        display?: string;
        lastUpdated: string;
    };
    address: {
        line: string;
        location: IPointSchema;
    };
    accounts: Array<IAccountsSchema>;
}

export interface IStoreUpdateSchema {
    name: string;
    licenseNumber: string;
    upi?: string;
    contact: ContactProps;
    address: StoreLocationProps;
    accounts: Array<StoreAccountProps>;
}

interface IDeliverySchema extends Document {
    _doc?: DocumentType;
    name?: string;
    line1?: string;
    location: IPointSchema;
}

export interface IUserSchema extends DocumentType {
    _doc: DocumentType;
    name?: string;
    contact: IContactSchema;
    addressBook: Array<IDeliverySchema>;
    meta: {
        lastLogin: string;
        loginCount: number;
        createdAt: string;
    };
}

export interface IUpdateAddressSchema {
    name: string;
    line: string;
    location: {
        coordinates: [string, string];
    };
}

export interface IEditProfileSchema {
    name: string;
    contact: IContactSchema;
}

export interface ITwilioMessageSchema {
    sid: string;
}

export interface IRegisterSchema {
    name: string;
    contact: IContactSchema;
    coordinates: [string, string];
    business: boolean;
}
