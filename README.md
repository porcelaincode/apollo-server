## Configure server

Setup env variables after creating `.env` file in the root directory. Following env variables are necessary for fully functioning server. More to be added accordingly

```sh
PORT=5000

REDIS_HOST=
REDIS_PORT=6379

NODE_ENV=

MONGODB_CONNECTION_STRING=

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_MESSAGING_SID=

TOKEN_SECRET=
REFRESH_TOKEN_SECRET=

GOOGLE_MAPS_APIKEY=
```

## Types

### Queries

```javascript
// user
getFeed;
getUser;
twoFactorAuth;
checkAuth;

// store
getStore;
getConfirmation;

// order
getOrder;
getOrders;
getDeliveryTimes; //FIXME: Unnecessary query
```

### Mutations

```javascript
// user
login;
register;
updateAddress;
deleteAddress;
editProfile;
deleteAccount;

// store
addAccount;
editStore;
addToInventory;

// order
createOrder;
alterOrderState;
alterDeliveryState;
```

### Subscriptions

```javascript
// user
userUpdate;

// store
storeUpdate;
inventoryUpdate;
accountUpdate;

// order
orderUpdate;
```
