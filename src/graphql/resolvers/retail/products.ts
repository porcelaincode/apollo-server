import { ObjectId } from 'bson';
import { AuthenticationError, UserInputError } from 'apollo-server-express';

import Product from '../../../models/Product';
import Inventory from '../../../models/Inventory';

import { checkAuthHeader } from '../../../utils/checkAuth';
import { IProductSchema } from '../../../types';

const checkName = (name: string, str: string) => {
    const pattern = str
        .split('')
        .map((x) => {
            return `(?=.*${x})`;
        })
        .join('');
    const regex = new RegExp(`${pattern}`, 'g');
    return name.match(regex);
};

export default {
    Query: {
        async getInventory(_, {}, req) {
            const { loggedUser, source } = checkAuthHeader(req);

            if (source.startsWith('locality-store')) {
                const inventory = await Inventory.findOne({
                    'meta.storeId': loggedUser.id,
                });

                return {
                    ...inventory._doc,
                    id: inventory._id,
                };
            }
            throw new AuthenticationError('User not authorized to access this route.');
        },
        async getProduct(_: any, { storeId, barcode }: { storeId: string; barcode: string }, req) {
            const { source } = checkAuthHeader(req, true);

            if (source.startsWith('locality-store')) {
                // check if product exists in store
                const inventory = await Inventory.findOne({ 'meta.storeId': storeId });

                const p = [...inventory.products].find((e) => e.barcode === barcode);

                if (p) {
                    return {
                        product: p,
                        inStore: true,
                    };
                } else {
                    const product = await Product.findOne({ barcode });
                    return {
                        product: {
                            ...product._doc,
                            id: product._id,
                        },
                        inStore: false,
                    };
                }
            } else if (source.startsWith('locality-user')) {
                throw new Error('User not authorized to acces this route');
            }

            throw new Error("Product doesn't exist with us, register the new product.");
        },
        async productRecommendations(_, { storeId }: { storeId: string }, req) {
            const products = [];

            return products;
        },
        async getProducts(_: any, { name, limit, storeId }: { name: string; limit: number; storeId: string }, req) {
            const { loggedUser, source } = checkAuthHeader(req);

            let products: Array<IProductSchema>;
            products = await Product.find({
                name: {
                    $regex: '^' + name,
                    $options: 'i',
                },
            }).limit(limit ? limit : 10000);

            if (products) {
                console.log(`${loggedUser.id} looked up ${name} in Store${storeId ? ' ' + storeId : ''}`);

                if (source.startsWith('locality-store')) {
                    const inventory = await Inventory.findOne({
                        'meta.storeId': loggedUser.id,
                    });

                    products.forEach((p, index) => {
                        const i = inventory.products.findIndex((e) => e.id === p.id);
                        if (i > -1) {
                            const product = inventory._doc.products[i];
                            products[index] = {
                                ...p._doc,
                                id: p.id,
                                quantity: {
                                    ...product.quantity,
                                    units: product.quantity.units || 0,
                                },
                            };
                        }
                    });
                }

                return products;
            } else {
                console.log(`${loggedUser.id} couldn't find ${name} in Store${storeId ? ' ' + storeId : ''}`);
                throw new UserInputError('No Products not found');
            }
        },
        async getProductsFromStore(_: any, { name, storeId }: { name: string; limit?: number; storeId: string }, req) {
            const { loggedUser } = checkAuthHeader(req);

            const inventory = await Inventory.findOne({ 'meta.storeId': storeId });

            const products = [...inventory.products].filter((x) => {
                return checkName(x.name, name);
            });

            if (inventory) {
                console.log(`${loggedUser.id} looked up ${name} in Store ${storeId}`);
                return { ...inventory._doc, products };
            } else {
                console.log(`${loggedUser.id} couldn't find ${name} in Store ${storeId}`);
                throw new UserInputError('No Products not found');
            }
        },
    },
    Mutation: {
        async editProduct(_, { product }: { product: IProductSchema }, req) {
            // const { loggedUser, source } = checkAuthHeader(req);

            if (product.id) {
                const p = await Product.findById(product.id);

                await Product.updateOne(
                    { _id: new ObjectId(product.id) },
                    {
                        ...product,
                    },
                );

                return {
                    ...p._doc,
                    ...product,
                };
            } else {
                delete product.id;

                const p = new Product({
                    ...product,
                });

                const res = await p.save();

                return {
                    ...res._doc,
                    id: res._id,
                };
            }
        },
    },
};
