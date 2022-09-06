import { gql } from "apollo-server-express";

module.exports = gql`
  type Product {
    id: ID!
    brand: String
    name: String!
    skus: [ProductSku]
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

  type Query {
    getProduct(id: String): Product
    getProducts(name: String, limit: Int): [Product]
  }
`;
