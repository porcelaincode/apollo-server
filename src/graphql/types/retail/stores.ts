import { gql } from "apollo-server-express";

module.exports = gql`
  type Store {
    id: ID!
    name: String
    stat: StoreStat
    contact: ContactType!
    meta: StoreMeta
    address: StoreAddress
    accounts: [StoreAccounts]
    token: String
    refreshToken: String
  }
  type StoreStat {
    amount: String
    count: Int
    error: Boolean
    errorMessage: String
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
  type ConfirmType {
    name: String!
    status: ConfirmStatus
    account: ConfirmAccount
  }
  type ConfirmStatus {
    closed: Boolean!
  }
  type ConfirmAccount {
    exists: Boolean
    closed: Boolean
    amount: String
    date: String
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
    getConfirmation(storeId: String!): ConfirmType
  }
  type Mutation {
    editStore(edit: Boolean!, storeInfo: StoreInfo): Store!
  }
  type Subscription {
    storeUpdate(id: String!): Store!
  }
`;
