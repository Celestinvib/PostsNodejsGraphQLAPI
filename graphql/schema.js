const { buildSchema } = require('graphql');

//The query,mutations & subscribes 'routes' processed later on in the resolvers
/*
    Notes:
    ·hello: String!   <- the ! to make it required if not get an string it will fail
    ·graphql don't know date fields
    ·createUser(userInput: UserInputData): User! <- What that function will return(':User!')
*/
module.exports = buildSchema(`
    type Post {
        _id: ID!
        title: String!
        content: String!
        imageUrl: String!
        creator: User!
        createdAt: String!
        updatedAt: String!
    }

    type User {
        _id: ID!
        name: String!
        email: String!
        password: String!
        status: String!
        posts: [Post!]!
    }

    input UserInputData {
        email: String!
        name: String!
        password: String!
    }

    input postInputData {
        title: String!
        content: String!
        imageUrl: String!
    }

    type AuthData {
        token: String!
        userId: String!
    }

    type PostData {
        posts: [Post!]!
        totalPosts: Int!
    }

    type RootQuery {
        login(email: String!,password:String!): AuthData!
        posts(page: Int): PostData!
        post(id: ID!): Post!
        user: User!
    }

    type RootMutation {
        createUser(userInput: UserInputData): User!
        createPost(postInput: postInputData): Post!
        updatePost(id: ID!, postInput: postInputData): Post!
        deletePost(id: ID!): Boolean
        updateStatus(status: String): User!
    }

    schema {
        query: RootQuery
        mutation: RootMutation
    }
`);