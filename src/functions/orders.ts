import Product from '../models/Product';
import { IOrderProductsSchema, IOrderSchema } from '../types';

import { asyncForEach } from '../utils/generalUtil';

export async function getOrderData({ data, user, inStore }: { data: any; user: any; inStore: boolean }) {
    let products: Array<IOrderProductsSchema>;
    let grandAmount: string;

    await asyncForEach(data.products, async (item) => {
        if (item.inStore) {
        } else {
            const p = await Product.findById(item.id);

            if (p) {
                products.push({
                    id: p._id,
                    brand: p.brand,
                    name: p.name,
                    url: p.url,
                    price: p.price,
                    quantity: item.quantity,
                    totalAmount: (item.quantity * parseFloat(p.price.mrp)).toString(),
                });
            }
        }
    });

    products.forEach((e) => {
        grandAmount += parseFloat(e.totalAmount);
    });

    const orderData: IOrderSchema = {
        products,
        linkedAccount: data.accountId || null,
        meta: {
            userId: user.id,
            storeId: data.storeId,
        },
        state: {
            method: data.method,
            delivery: {
                toDeliver: data.delivery,
                address: null,
                deliverBy: new Date(Date.now() + parseFloat(data.deliverBy)).toISOString() || null,
            },
        },
    };

    if (inStore) {
        orderData.state.delivery.toDeliver = false;
        orderData.state.delivery.deliverBy = null;
    } else {
        orderData.state.payment.paid = false;
        orderData.state.grandAmount.grandAmount = grandAmount;
    }

    return orderData;
}
