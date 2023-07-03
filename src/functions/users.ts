import { IDeliverySchema } from '../types';

function cleanupAddresses(addresses: Array<IDeliverySchema>) {
    const data = [];
    addresses.forEach((address) => {
        data.push({
            ...address._doc,
            id: address._id,
        });
    });
    return data;
}

export { cleanupAddresses };
