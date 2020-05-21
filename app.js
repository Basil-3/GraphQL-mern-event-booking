const express = require('express');
const bodyParser = require('body-parser');
const graphQLHttp = require('express-graphql');
const mongoose = require('mongoose');
const app = express();

const graphQlSchema = require('./Graphql/Schema/index');
const graphQlResolvers = require('./Graphql/Resolvers/index');

app.use(bodyParser.json());



app.use('/graphql', graphQLHttp({
    schema: graphQlSchema,
    rootValue: graphQlResolvers,
    graphiql: true
}));

mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@node-rest-shop-avu9b.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`)
    .then(() => {
        app.listen(3030);
    })
    .catch(err => {
        console.log(err);
    });
