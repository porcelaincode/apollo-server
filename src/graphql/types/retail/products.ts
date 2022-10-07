import { gql } from "apollo-server-express";

module.exports = gql`
  type Product {
    id: ID!
    brand: String
    name: String!
    skus: [ProductSku]
    inStore: Boolean
  }
  type ProductSku {
    id: ID!
    url: String
    fetchUri: String
    name: String
    brand: String
    quantity: SkuQuantity
    price: SkuPrice
    barcode: String
    ratings: [Int]
  }
  type SkuQuantity {
    count: String!
    type: String!
  }
  type SkuPrice {
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
    quantity: InventorySkuQuantity
    price: SkuPrice
    barcode: String
  }
  type InventorySkuQuantity {
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
    addToInventory(productInfo: [ProductToInventoryInput]): Boolean!
  }
`;
