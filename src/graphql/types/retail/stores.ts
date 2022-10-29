import { gql } from "apollo-server-express";

module.exports = gql`
  type Store {
    id: ID!
    name: String
    stat: StoreStat
    contact: ContactType!
    meta: StoreMeta
    address: StoreAddress
    accounts: [StoreAccount]
    token: String
    refreshToken: String
  }
  type StoreStat {
    amount: String
    count: Int
    error: Boolean
    errorMessage: String
  }
  type StoreAccount {
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
    lastUpdated: String
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

  input ProductInput {
    id: String!
    price: String
    name: String
    quantity: QuantityInput
  }
  input QuantityInput {
    units: Int
    count: String
    type: String
  }

  type Query {
    getStore: Store!
    getConfirmation(storeId: String!): ConfirmType
  }
  type Mutation {
    addAccount(contact: ContactInput!, orderId: String!): Boolean!
    editStore(edit: Boolean!, storeInfo: StoreInfo): Store!
    addToInventory(products: [ProductToInventoryInput]): Boolean!
  }
  type Subscription {
    storeUpdate(id: String!): Store!
    inventoryUpdate(id: String!): Inventory!
    accountUpdate(contact: ContactInput, storeId: String!): StoreAccount
  }
`;
