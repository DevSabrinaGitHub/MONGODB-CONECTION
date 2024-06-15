const { ApolloServer } = require('apollo-server');
const typeDefs = require('./db/schema');
const resolvers = require('./db/resolvers');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: 'variables.env' });
const conectarDB = require('./config/db');

// Conectamos la base de datos
conectarDB();

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    // Obtener el token de los headers de la solicitud
    const token = req.headers['authorization'] || '';

    if (token) {
      try {
        // Verificar y decodificar el token
        const usuario = jwt.verify(token, process.env.SECRETA);
        return { usuario };
      } catch (error) {
        console.log("Hubo un error al verificar el token", error);
      }
    }
    return {}; // Devolver un objeto vacío si no hay token
  }
});

server.listen().then(({ url }) => {
  console.log(`Servidor listo en la URL ${url}`);
});
