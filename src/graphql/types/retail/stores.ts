import { gql } from "apollo-server-express";

module.exports = gql`
  type Store {
    id: ID!
    name: String
    contact: ContactType!
    meta: StoreMeta
    address: StoreAddress
    accounts: [StoreAccounts]
    token: String
    refreshToken: String
  }
  type StoreAccounts {
    id: String
    name: String
    lastUpdated: String
    closed: Boolean
    order: [StoreAccountOrders]
    pending: StoreAccountPending
  }
  type StoreAccountOrders {
    orderId: String
    paid: Boolean
    date: String
    amount: String
  }
  type StoreAccountPending {
    status: Boolean
    amount: String
  }
  type StoreMeta {
    verified: Boolean
    closed: Boolean
  }
  type StoreAddress {
    id: ID!
    line: String
    location: PointType
  }
  input StoreAddressInput {
    line1: String
    location: LocationInput
  }
  input StoreInfo {
    name: String
    contact: ContactInput
    address: StoreAddressInput
  }

  type Query {
    getStore: Store!
  }
  type Mutation {
    editStore(id: String, storeInfo: StoreInfo): Store!
  }
  type Subscription {
    storeUpdate(id: String!): Store!
  }
`;
