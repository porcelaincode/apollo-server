import { gql } from 'apollo-server-express';

export default gql`
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
        units: Int
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
        quantity: QuantityType
        price: PriceType
        barcode: String
    }
    type GetProduct {
        product: Product
        inStore: Boolean
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
        barcode: String!
        brand: String
        name: String
        quantity: QuantityInput
        totalAmount: String
        price: PriceInput
        url: String
    }

    type Query {
        getInventory: Inventory!
        productRecommendations(storeId: String): [Product]
        getProduct(storeId: String!, barcode: String!): GetProduct
        # FIXME: Two queries of same Type
        getProducts(name: String!, limit: Int!): [Product]
        getProductsFromStore(name: String!, limit: Int!, storeId: String!): Inventory
    }
    type Mutation {
        editProduct(product: ProductToInventoryInput): Product!
    }
`;
