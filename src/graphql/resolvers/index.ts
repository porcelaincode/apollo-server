// auth
import usersResolvers from './auth/users';

// retail
import storeResolvers from './retail/stores';
import orderResolvers from './retail/orders';
import productResolvers from './retail/products';

export default {
    Query: {
        ...usersResolvers.Query,
        ...orderResolvers.Query,
        ...storeResolvers.Query,
        ...productResolvers.Query,
    },
    Mutation: {
        ...usersResolvers.Mutation,
        ...orderResolvers.Mutation,
        ...storeResolvers.Mutation,
        ...productResolvers.Mutation,
    },
    Subscription: {
        ...usersResolvers.Subscriptions,
        ...orderResolvers.Subscriptions,
        ...storeResolvers.Subscriptions,
    },
};
