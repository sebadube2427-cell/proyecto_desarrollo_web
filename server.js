
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const { ApolloServer, gql } = require("apollo-server-express");
const Usuario = require("./models/usuario");

mongoose.connect("mongodb://localhost:27017/bdweb");

const typeDefs = gql`
    type Usuario {
        id: ID!
        nombre: String!
        pass: String!
    }

    input UsuarioInput {
        nombre: String!
        pass: String!
    }

    type Alert {
        message: String
    }

    type Query {
        getUsuario: [Usuario]
        getUsuarioById(id: ID!): Usuario
    }

    type Mutation {
        addUsuario(input: UsuarioInput): Usuario
        updUsuario(id: ID!, input: UsuarioInput): Usuario
        delUsuario(id: ID!): Alert
    }
`;

const resolvers = {
    Query: {
        async getUsuario(obj) {
            const usuarios = await Usuario.find();
            return usuarios;
        },

        async getUsuarioById(obj, { id }) {
            const usuarioBus = await Usuario.findById(id);

            if (usuarioBus == null) {
                return null;
            } else {
                return usuarioBus;
            }
        }
    },

    Mutation: {
        async addUsuario(obj, { input }) {
            const usuario = new Usuario(input);
            await usuario.save();
            return usuario;
        },

        async updUsuario(obj, { id, input }) {
            const usuario = await Usuario.findByIdAndUpdate(id, input);
            return usuario;
        },

        async delUsuario(obj, { id }) {
            await Usuario.deleteOne({ _id: id });

            return {
                message: "usuario eliminado."
            };
        }
    }
};

let apolloserver = null;

const corsOption = {
    origin: "http://localhost:8090",
    credentials: false
};

const app = express();

async function startServer() {
    apolloserver = new ApolloServer({
        typeDefs,
        resolvers
    });

    await apolloserver.start();

    apolloserver.applyMiddleware({
        app,
        cors: corsOption
    });
}

startServer();

app.use(cors());

app.listen(8090, function () {
    console.log("Graphql iniciado");
});
