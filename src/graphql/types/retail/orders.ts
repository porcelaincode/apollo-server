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
    order: OrderCancelledType
    created: OrderCreatedType
    delivery: OrderDeliveryType
    payment: OrderPaymentType
    cancelled: Boolean
  }
  type OrderCreatedType {
    date: String
  }
  type OrderCancelledType {
    accepted: Boolean
    date: String
  }

  type OrderDeliveryType {
    toDeliver: Boolean!
    address: OrderDeliveryAddress
    deliverBy: String
    delivered: Boolean
    deliveredAt: String
  }
  type OrderDeliveryAddress {
    line: String
    location: PointType!
  }
  type OrderPaymentType {
    paid: Boolean
    grandAmount: String!
    paidAt: String
  }

  type OrderMetaType {
    userId: String!
    storeId: String!
  }

  type OrderProduct {
    brand: String
    name: String!
    url: String
    price: PriceType
    quantity: Int!
    totalAmount: String
  }
  type PriceType {
    mrp: String!
    discount: String
  }

  input OrderInputProduct {
    id: String!
    quantity: Int!
    inStore: Boolean!
  }
  input OrderInfo {
    products: [OrderInputProduct]
    addressId: String!
    storeId: String!
    delivery: Boolean!
    deliverBy: String
    addToAccount: Boolean!
  }

  type Query {
    getOrder(id: String!): Order!
    getOrders: [Order]!
  }
  type Mutation {
    createOrder(orderInfo: OrderInfo): Order!
    acceptOrder(id: String!, accepted: Boolean!, products: [String]): Boolean!
    deliveredOrder(id: String!, coordinates: [String]!): Boolean
  }
  type Subscription {
    orderUpdate(id: String!): Order!
  }
`;
