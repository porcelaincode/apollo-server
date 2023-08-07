import { gql } from "apollo-server-express";

export default gql`
  type User {
    id: ID!
    name: String
    contact: ContactType!
    addressBook: [UserAddress]
    meta: MetaType
    token: String!
    refreshToken: String!
  }
  type ContactType {
    ISD: String
    number: String!
  }
  type MetaType {
    lastLogin: String!
    loginCount: Int!
    createdAt: String!
  }
  type PointType {
    hash: String
    coordinates: [String]
  }
  type UserAddress {
    id: String!
    name: String
    line1: String
    location: PointType
  }
  type Feed {
    store: FeedStore
    alikeProducts: [InventoryProduct]
    recentProducts: [OrderProduct]
  }
  type FeedStore {
    id: String
    storeName: String
    lastUpdated: String
    distance: String
    available: Boolean
  }
  type Code {
    date: String
    error: Boolean
    message: String
  }
  type AuthMsg {
    status: Boolean
    error: Boolean
    errorMsg: String
  }

  input UserInfoInput {
    name: String
    contact: ContactInput
  }
  input ContactInput {
    ISD: String
    number: String!
  }

  input UpdateAddress {
    name: String
    line1: String
    location: LocationInput
  }

  input LocationInput {
    coordinates: [String]
  }

  type Query {
    getFeed(coordinates: [String]): Feed!
    getUser: User!
    twoFactorAuth(contact: ContactInput!, newAcc: Boolean!): Code
    checkAuth(contact: ContactInput!, secureCode: String!): AuthMsg
  }
  type Mutation {
    register(userInfoInput: UserInfoInput): User!
    updateAddress(id: String, addressInfo: UpdateAddress): Boolean!
    deleteAddress(id: String!): Boolean!
    editProfile(userInfoInput: UserInfoInput): Boolean!
    login(contact: ContactInput!): User!
    deleteAccount: Boolean
  }
  type Subscription {
    userUpdate(id: String!): User!
  }
`;
