import { withFilter } from "graphql-subscriptions";
import { updateInventory } from "../../../functions/inventories";
import {
  ContactProps,
  CreateOrderProps,
  OrderProductProps,
  OrderProps,
  ProductProps,
} from "../../../props";

const mongoose = require("mongoose");
const bson = require("bson");

const Order = mongoose.model.Order || require("../../../models/Order");
const User = mongoose.model.User || require("../../../models/User");
const Store = mongoose.model.Store || require("../../../models/Store");

const checkAuth = require("../../../utils/checkAuth");

const { findNearbyStores } = require("../../../brain");
const { calcCrow } = require("../../../brain");
const { asyncForEach } = require("../../../utils/generalUtil");

const pubsub = require("../../../pubsub");

const ORDER_UPDATE = "ORDER_UPDATE";
const ACCOUNT_UPDATE = "ACCOUNTS_UPDATE";

import { StoreLocationProps } from "../../../props";

module.exports = {
  Query: {
    async getOrder(_: any, { id }: { id: string }, req) {
      const { loggedUser, source } = checkAuth(req);

      console.log(`Order ${id} requested.`);

      const order = await Order.findById(id);

      if (order) {
        return order;
      } else {
        throw new Error("User not found");
      }
    },
    async getOrders(
      _: any,
      { limit, offset }: { limit: number; offset: number },
      req
    ) {
      const { loggedUser, source } = checkAuth(req);

      let orders: Array<OrderProps>;

      if (source.startsWith("locale-store")) {
        console.log(`Store ${loggedUser.id} requesting all orders.`);
        orders = await Order.find({
          "meta.storeId": loggedUser.id,
          "state.order.cancelled": false,
        })
          .limit(limit)
          .sort({
            "state.created.date": -1,
          });
      } else if (source.startsWith("locale-user")) {
        console.log(`User ${loggedUser.id} requesting all orders.`);
        orders = await Order.find({ "meta.userId": loggedUser.id })
          .limit(limit)
          .sort({
            "state.created.date": -1,
          });
      } else {
        throw new AuthenticationError("Request not verified");
      }

      return orders;
    },
    async getDeliveryTimes(_: any, {}, req: any) {
      const { loggedUser } = checkAuth(req);

      if (!loggedUser) {
        throw new Error("Error Occured");
      }

      const deliveryTimes = [
        {
          type: "10 min",
          text: "Order will be dispatched from store nearest to you within 10 mins. Approx. time: ",
          n: "600000",
          active: true,
        },
        {
          type: "1 hr",
          text: "Order will be dispatched from store nearest to you within an hour. Approx. time: ",
          n: "3600000",
          active: true,
        },
        {
          type: "1-2 hr",
          text: "Order will be dispatched from store nearest to you within a couple of hours. Approx. time: ",
          n: "7200000",
          active: true,
        },
        {
          type: "6 hr",
          text: "Order will be dispatched from store nearest to you within 6 hours. Approx. time: ",
          n: "21600000",
          active: true,
        },
      ];

      return deliveryTimes;
    },
  },
  Mutation: {
    async createOrder(
      _: any,
      { orderInfo }: { orderInfo: CreateOrderProps },
      req
    ) {
      const { loggedUser, source } = checkAuth(req);

      const data = { ...orderInfo };

      let address: StoreLocationProps;
      const products: Array<ProductProps> = data.products;
      let grandAmount = 0;

      products.forEach((e) => {
        grandAmount += parseFloat(e.totalAmount);
      });

      const orderData = {
        products,
        linkedAccount: data.accountId || null,
        meta: {
          userId: loggedUser.id,
          storeId: data.storeId,
        },
        state: {
          method: data.method,
          delivery: {
            toDeliver: data.delivery,
            address: null,
            deliverBy:
              new Date(Date.now() + parseFloat(data.deliverBy)).toISOString() ||
              null,
          },
        },
      };

      if (source.startsWith("locale-store")) {
        console.log(`Store ${loggedUser.id} requesting to register an order.`);

        const newOrder = new Order({
          ...orderData,
          state: {
            ...orderData.state,
            delivery: {
              ...orderData.state.delivery,
              delivered: true,
              deliveredAt: new Date().toISOString(),
            },
            created: {
              date: new Date().toISOString(),
              message: "Registered In Store order.",
            },
            order: {
              accepted: true,
              date: new Date().toISOString(),
            },
            payment: {
              paid: true,
              paidAt: new Date().toISOString(),
              method: data.method,
              grandAmount: data.grandTotal,
            },
          },
        });

        const res = await newOrder.save();

        pubsub.publish(ORDER_UPDATE, {
          orderUpdate: {
            ...res._doc,
            id: res._id,
          },
        });

        await updateInventory(data.products, data.storeId);

        return {
          ...res._doc,
          id: res._id,
        };
      } else if (source.startsWith("locale-user")) {
        console.log(`User ${loggedUser.id} requesting to register an order.`);

        if (data.delivery) {
          const u = await User.findById(loggedUser.id);

          address = u.deliveryAddresses.find(
            (e) => e.id.toString() === data.addressId
          );
        }

        const newOrder = new Order({
          ...orderData,
          state: {
            ...orderData.state,
            created: {
              date: new Date().toISOString(),
            },
            delivery: {
              ...orderData.state.delivery,
              address: data.delivery
                ? {
                    line: address.line1,
                    location: address.location,
                  }
                : null,
            },
            payment: {
              paid: false,
              grandAmount: grandAmount.toString(),
            },
          },
        });

        const res = await newOrder.save();

        pubsub.publish(ORDER_UPDATE, {
          orderUpdate: {
            ...res._doc,
            id: res._id,
          },
        });

        return {
          ...res._doc,
          id: res._id,
        };
      } else {
        AuthenticationError("Request not verified.");
      }
    },
    async alterOrderState(
      _: any,
      {
        id,
        accepted,
        cancel,
        products,
      }: {
        id: string;
        accepted: boolean;
        cancel: boolean;
        products: Array<string>;
      },
      req
    ) {
      const { loggedUser, source } = checkAuth(req);

      if (source.startsWith("locale-store")) {
        if (accepted) {
          console.log(
            `Store ${loggedUser.id} requesting to accept order ${id}`
          );

          const order_ = await Order.updateOne(
            { _id: bson.ObjectId(id) },
            {
              $set: {
                "state.order.accepted": accepted,
                "state.order.date": new Date().toISOString(),
              },
            }
          );

          const res = await Order.findById(id);

          if (accepted && res.linkedAccount) {
            const store = await Store.findById(loggedUser.id);
            const accounts = [...store.accounts];

            const account = accounts.find((e) => e.id === res.linkedAccount);

            if (account) {
              const orders = [...account.orders].concat({
                orderId: res._id.toString(),
                paid: res.state.payment.paid,
                amount: res.state.payment.grandAmount,
              });

              const i = orders.findIndex((e) => e.paid === false);

              const updatedAccount = {
                ...account,
                lastUpdated: new Date().toISOString(),
                orders,
                closed: i <= -1 ? true : false,
                pending: {
                  status: i <= -1 ? false : true,
                  amount: (
                    parseFloat(account.pending.amount) +
                    parseFloat(res._doc.status.payment.grandAmount)
                  ).toString(),
                },
              };

              const j = accounts.findIndex((e) => e.id === res.linkedAccount);

              accounts.splice(j, 1);

              const updatedRunningAccounts = [updatedAccount].concat(accounts);

              const updatingRunningAccount = await Store.updateOne(
                { _id: bson.ObjectId(loggedUser.id) },
                {
                  $set: {
                    accounts: updatedRunningAccounts,
                  },
                }
              );
            } else {
              const user = await User.findById(res.linkedAccount);

              const newAccount = {
                id: res._doc.linkedAccount,
                name: user.name,
                lastUpdated: new Date().toISOString(),
                closed: res._doc.state.payment.paid,
                orders: [
                  {
                    orderId: res._id.toString(),
                    paid: res._doc.state.payment.paid,
                    amount: res._doc.state.payment.grandAmount,
                  },
                ],
              };
              const updatingStore = await Store.updateOne(
                { _id: bson.ObjectId(loggedUser.id) },
                {
                  $push: {
                    accounts: newAccount,
                  },
                }
              );

              if (updatingStore.modifiedCount) {
                const updatedStore = await Store.findById(loggedUser.id);

                var updatedaccounts = [...updatedStore.accounts];

                const userAccount = updatedaccounts?.find(
                  (e) => e.id === res.linkedAccount
                );

                pubsub.publish(ACCOUNT_UPDATE, {
                  accountsUpdate: {
                    store: {
                      id: updatedStore._id,
                      name: updatedStore._doc.name,
                    },
                    data: {
                      ...userAccount,
                      id: userAccount._id,
                    },
                  },
                });
              }
            }
          }
          pubsub.publish(ORDER_UPDATE, {
            orderUpdate: {
              ...res._doc,
              id: res._id,
            },
          });

          return order_.modifiedCount ? true : false;
        } else {
          console.log(`Store ${loggedUser.id} rejected order ${id}`);
          const res = await Order.findById(id);

          const prevStore = res.meta.storeId;
          const geohash = res.state.delivery.address.location.hash;

          const nearbyStores: Array<any> = await findNearbyStores(geohash);

          nearbyStores.filter((store) => store.id !== prevStore.id);

          console.log(nearbyStores);

          if (nearbyStores[0]) {
            const order_ = await Order.updateOne(
              { _id: bson.ObjectId(id) },
              {
                $set: {
                  "meta.storeId": nearbyStores[0].id,
                },
              }
            );

            if (order_.modifiedCount) {
              pubsub.publish(ORDER_UPDATE, {
                orderUpdate: {
                  ...res._doc,
                  id: res._id,
                  "meta.storeId": nearbyStores[0].id,
                },
              });

              return true;
            } else {
              return false;
            }
          } else {
            const order_ = await Order.updateOne(
              { _id: bson.ObjectId(id) },
              {
                $set: {
                  "state.order.cancelled": true,
                  "state.order.accepted": false,
                  "state.message":
                    "Nearby store(s) did not accept your order. We're getting working on it.",
                  "state.order.date": new Date().toISOString(),
                },
              }
            );

            if (order_.modifiedCount) {
              pubsub.publish(ORDER_UPDATE, {
                orderUpdate: {
                  ...res._doc,
                  id: res._id,
                  state: {
                    ...res._doc.state,
                    order: {
                      cancelled: true,
                      accepted: false,
                      date: new Date().toISOString(),
                    },
                    message:
                      "Nearby store(s) did not accept your order. We're getting working on it.",
                  },
                },
              });

              return true;
            } else {
              return false;
            }
          }
        }
      } else if (source.startsWith("locale-user")) {
        console.log(`User ${loggedUser.id} requesting to cancel order ${id}`);

        const order_ = await Order.updateOne(
          { _id: bson.ObjectId(id) },
          {
            $set: {
              "state.order.cancelled": cancel,
              "state.message": "Order cancelled by user.",
              "state.order.date": new Date().toISOString(),
            },
          }
        );

        const res = await Order.findById(id);

        pubsub.publish(ORDER_UPDATE, {
          orderUpdate: {
            ...res._doc,
            id: res._id,
          },
        });

        return order_.modifiedCount ? true : false;
      } else {
        AuthenticationError("Request not verified.");
      }
    },
    async dispatchOrder(_, { id }, req) {
      const { loggedUser, source } = checkAuth(req);

      if (source.startsWith("locale-user")) {
        throw new AuthenticationError("User not authorised.");
      }

      const orderToUpdate = await Order.findOne({
        _id: bson.ObjectId(id),
        "meta.storeId": loggedUser.id,
      });

      if (!orderToUpdate) {
        throw new AuthenticationError("Store not authorised.");
      }

      if (orderToUpdate.state.delivery.dispatched) {
        throw new Error("Order already dispatched");
      }

      const orderUpdate = await Order.updateOne(
        {
          _id: bson.ObjectId(id),
        },
        {
          $set: {
            "state.delivery.dispatched": true,
            "state.delivery.dispatchedAt": new Date().toISOString(),
          },
        }
      );

      pubsub.publish(ORDER_UPDATE, {
        orderUpdate: {
          ...orderToUpdate._doc,
          id: orderToUpdate._id,
          state: {
            ...orderToUpdate._doc.state,
            delivery: {
              ...orderToUpdate._doc.state.delivery,
              dispatched: true,
              dispatchedAt: new Date().toISOString(),
            },
          },
        },
      });

      console.log(`Order ${id} dispatched.`);

      return orderUpdate.modifiedCount ? true : false;
    },
    async deliverOrder(
      _: any,
      {
        id,
        coordinates,
      }: {
        id: string;
        coordinates: [string, string];
      },
      req: any
    ) {
      const { loggedUser, source } = checkAuth(req);

      if (source.startsWith("locale-user")) {
        throw new AuthenticationError("User not authorised.");
      }

      const orderToUpdate = await Order.findOne({
        _id: bson.ObjectId(id),
        "meta.storeId": loggedUser.id,
      });

      if (!orderToUpdate) {
        throw new AuthenticationError("Store not authorised.");
      }

      const deliveryDistance = calcCrow(
        coordinates[0],
        coordinates[1],
        orderToUpdate.state.delivery.address.location.coordinates[0],
        orderToUpdate.state.delivery.address.location.coordinates[1]
      );

      if (deliveryDistance.toFixed(3) < 0.3) {
        const deliveryDate = new Date().toISOString();

        const orderUpdate = await Order.updateOne(
          {
            _id: bson.ObjectId(id),
          },
          {
            $set: {
              "state.delivery.delivered": true,
              "state.delivery.deliveredAt": deliveryDate,
            },
          }
        );

        pubsub.publish(ORDER_UPDATE, {
          orderUpdate: {
            ...orderToUpdate._doc,
            id: orderToUpdate._id,
            state: {
              ...orderToUpdate._doc.state,
              delivery: {
                ...orderToUpdate._doc.state.delivery,
                delivered: true,
                deliveredAt: deliveryDate,
              },
            },
          },
        });

        console.log(`Order ${id} delivered.`);

        return orderUpdate.modifiedCount ? true : false;
      } else {
        throw new Error("You're not near delivery location");
      }
    },
    async paymentStatus(
      _,
      { id, method }: { id: string; method: string },
      req
    ) {
      const { loggedUser, source } = checkAuth(req);

      if (source.startsWith("locale-store")) {
        const orderUpdate = await Order.updateOne(
          {
            _id: bson.ObjectId(id),
            "meta.storeId": loggedUser.id,
          },
          {
            "state.payment.paid": true,
            "state.payment.method": method,
            "state.payment.paidAt": new Date().toISOString(),
          }
        );

        const orderToUpdate = await Order.findById(id);

        pubsub.publish(ORDER_UPDATE, {
          orderUpdate: {
            ...orderToUpdate._doc,
            id: orderToUpdate._id,
          },
        });

        // update account
        if (orderToUpdate.linkedAccount) {
          const store = await Store.findById(loggedUser.id);

          const accounts = [...store.accounts];

          let i = accounts.findIndex(
            (a) => a.id === orderToUpdate.linkedAccount
          );

          let account = accounts[i];

          // find and update order
          let orders = account.orders;
          let m = orders.findIndex(
            (o) => o.orderId === orderToUpdate._id.toString()
          );
          orders[m].paid = true;
          orders[m].date = new Date().toISOString();

          accounts.splice(i, 1);

          const updatedAccounts = [...accounts].concat(account);

          await Store.updateOne(
            { _id: orderToUpdate._id },
            {
              $set: {
                accounts: updatedAccounts,
              },
            }
          );
        }

        return orderUpdate.modifiedCount ? true : false;
      } else if (source.startsWith("locale-user")) {
        throw new AuthenticationError("User cannot change payment status");
      }

      return false;
    },
    async updateAccount(
      _,
      {
        orderId,
        accountId,
        paid,
        method,
      }: { orderId: string; accountId: string; paid: boolean; method: string },
      req
    ) {
      const { loggedUser, source } = checkAuth(req);

      if (source.startsWith("locale-store")) {
        const order = await Order.findById(orderId);
        const store = await Store.findById(loggedUser.id);

        let date = new Date().toISOString();

        await Order.updateOne(
          { _id: bson.ObjectId(order._id) },
          {
            $set: {
              linkedAccount: accountId,
            },
          }
        );

        let accounts = [...store.accounts];

        let i = accounts.findIndex((account) => account.id === accountId);

        if (i <= -1) {
          // push new account into array
          const user = await User.findById(order.meta.userId);

          const account = {
            id: user._id.toString(),
            name: user.name,
            lastUpdated: new Date().toISOString(),
            closed: false,
            orders: [
              {
                orderId: order._id,
                paid: false,
                date,
                amount: order.state.payment.grandAmount,
              },
            ],
            pending: {
              status: true,
              amount: order.state.payment.grandAmount,
            },
          };

          const newAccounts = [...accounts].concat(account);

          let storeUpdate = await Store.updateOne(
            { _id: bson.ObjectId(loggedUser.id) },
            {
              $set: {
                accounts: newAccounts,
              },
            }
          );

          if (storeUpdate.modifiedCount) {
            return account;
          } else {
            throw new Error(
              "Facing error processing account request. Try again in some time."
            );
          }
        } else {
          // update account
          let newAccount = accounts[i];

          if (paid) {
            let orders = newAccount.orders.filter((a) => a.paid === false);

            await asyncForEach(orders, async (order) => {
              await Order.updateOne(
                {
                  _id: bson.ObjectId(order.orderId),
                },
                {
                  "state.payment.paid": true,
                  "state.payment.method": method,
                  "state.payment.paidAt": date,
                }
              );
            });
          }

          let orders = [...newAccount.orders].concat({
            orderId: order._id,
            paid: false,
            date,
            amount: order.state.payment.grandAmount,
          });

          accounts.splice(i, 1);

          let updatedAccount = {
            ...newAccount,
            lastUpdated: date,
            closed: false,
            orders,
            pending: {
              status: true,
              amount: order.state.payment.grandAmount,
            },
          };

          const newAccounts = [...accounts].concat(updatedAccount);

          let storeUpdate = await Store.updateOne(
            { _id: bson.ObjectId(loggedUser.id) },
            {
              $set: {
                accounts: newAccounts,
              },
            }
          );

          if (storeUpdate.modifiedCount) {
            return updatedAccount;
          } else {
            throw new Error(
              "Facing error processing account request. Try again in some time."
            );
          }
        }
      } else {
        throw new AuthenticationError("User cannot access this route.");
      }
    },
  },
  Subscriptions: {
    orderUpdate: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([ORDER_UPDATE]),
        (payload: any, variables: any) => {
          return (
            payload.orderUpdate.meta.storeId === variables.id ||
            payload.orderUpdate.meta.userId === variables.id
          );
        }
      ),
    },
    accountUpdate: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([ACCOUNT_UPDATE]),
        (
          payload: { accountUpdate: any },
          variables: { contact: ContactProps; storeId: string }
        ) => {
          return (
            payload.accountUpdate.data.contact.number ===
              variables.contact.number ||
            payload.accountUpdate.store.id === variables.storeId
          );
        }
      ),
    },
  },
};
