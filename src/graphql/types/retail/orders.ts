import { gql } from "apollo-server-express";

module.exports = gql`
  type Order {
    id: ID!
    meta: OrderMetaType
    products: [OrderProduct]
    linkedAccount: String
    state: OrderStateType
  }
  type OrderStateType {
    message: String
    order: OrderCancelledType
    created: OrderCreatedType
    delivery: OrderDeliveryType
    payment: OrderPaymentType
  }
  type OrderCreatedType {
    date: String
  }
  type OrderCancelledType {
    cancelled: Boolean
    accepted: Boolean
    date: String
  }
  type OrderDeliveryType {
    toDeliver: Boolean!
    address: OrderDeliveryAddress
    deliverBy: String
    delivered: Boolean
    deliveredAt: String
    dispatched: Boolean
    dispatchedAt: String
  }
  type OrderDeliveryAddress {
    line: String
    location: PointType
  }
  type OrderPaymentType {
    method: String
    paid: Boolean
    grandAmount: String!
    paidAt: String
  }
  type OrderMetaType {
    userId: String!
    storeId: String!
  }
  type OrderQuantityType {
    units: Int!
    count: String
    type: String
  }
  type OrderProduct {
    id: String!
    brand: String
    name: String!
    url: String
    price: PriceType
    quantity: OrderQuantityType
    totalAmount: String
  }
  type DeliveryTimes {
    type: String
    text: String
    n: String
    active: Boolean
  }
  type PriceType {
    mrp: String!
    discount: String
  }
  input OrderInputProduct {
    id: String!
    barcode: String
    name: String
    quantity: QuantityInput
    totalAmount: String
    price: PriceInput
    url: String
  }
  input OrderInfo {
    products: [OrderInputProduct]
    grandTotal: String
    addressId: String
    storeId: String!
    delivery: Boolean!
    deliverBy: String
    accountId: String
    method: String
  }
  type Query {
    getOrder(id: String!): Order!
    getOrders(limit: Int!, offset: Int!): [Order]!
    getDeliveryTimes: [DeliveryTimes]
  }
  type Mutation {
    createOrder(orderInfo: OrderInfo): Order!
    alterOrderState(
      id: String!
      accepted: Boolean
      cancel: Boolean
      products: [String]
    ): Boolean!
    dispatchOrder(id: String!): Boolean!
    deliverOrder(id: String!, coordinates: [String]!): Boolean!
  }
  type Subscription {
    orderUpdate(id: String!): Order!
  }
`;
