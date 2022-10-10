import { gql } from "apollo-server-express";

module.exports = gql`
  type Product {
    id: ID!
    url: String
    fetchUri: String
    name: String
    brand: String
    quantity: QuantityType
    price: PriceType
    barcode: String
    ratings: [Int]
    inStore: Boolean
  }
  type QuantityType {
    count: String!
    type: String!
  }
  type PriceType {
    mrp: String!
    discount: String
  }

  type Inventory {
    id: ID!
    meta: InventoryMeta
    products: [InventoryProduct]
  }
  type InventoryMeta {
    storeId: String!
    lastUpdated: String!
  }
  type InventoryProduct {
    id: String
    url: String
    name: String
    quantity: InventoryQuantityType
    price: PriceType
    barcode: String
  }
  type InventoryQuantityType {
    units: Int!
    count: String!
    type: String!
  }

  input PriceInput {
    mrp: String!
    discount: String
  }
  input QuantityInput {
    units: Int
    count: String!
    type: String
  }
  input ProductToInventoryInput {
    id: String
    barcode: String
    brand: String!
    name: String
    quantity: QuantityInput
    price: PriceInput
  }

  type Query {
    getInventory: Inventory!
    getProduct(storeId: String!, barcode: String!): Product
    getProducts(name: String, limit: Int): [Product]
  }
  type Mutation {
    editProduct(id: String!, barcode: String!, url: String): Product!
    addToInventory(productInfo: [ProductToInventoryInput]): Boolean!
  }
`;
