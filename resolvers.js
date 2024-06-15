const Usuario = require('../models/Usuario');
const Cliente = require('../models/Cliente');
const Producto = require('../models/Producto');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: 'variables.env' });

const crearToken = (usuario, secreta, expiresIn) => {
  const { id, email, nombre, apellido } = usuario;
  return jwt.sign({ id, email, nombre, apellido }, secreta, { expiresIn });
}

const resolvers = {
  Query: {
    obtenerUsuario: async (_, { token }) => {
      try {
        const usuarioId = await jwt.verify(token, process.env.SECRETA);
        return usuarioId;
      } catch (error) {
        console.log(error);
        throw new Error('Token inválido');
      }
    },
    obtenerProductos: async () => {
      try {
        return await Producto.find({});
      } catch (error) {
        console.log(error);
        throw new Error('Error al obtener productos');
      }
    },
    obtenerProducto: async (_, { id }) => {
      try {
        const producto = await Producto.findById(id);
        if (!producto) throw new Error('Producto no encontrado');
        return producto;
      } catch (error) {
        console.log(error);
        throw new Error('Error al obtener el producto');
      }
    },
    obtenerClientes: async () => {
      try {
        return await Cliente.find({});
      } catch (error) {
        console.log(error);
        throw new Error('Error al obtener clientes');
      }
    },
    obtenerClientesVendedor: async (_, __, ctx) => {
      if (!ctx.usuario) throw new Error('No autenticado');
      try {
        return await Cliente.find({ vendedor: ctx.usuario.id.toString() });
      } catch (error) {
        console.log(error);
        throw new Error('Error al obtener clientes del vendedor');
      }
    },
    obtenerCliente: async (_, { id }, ctx) => {
      if (!ctx.usuario) throw new Error('No autenticado');
      try {
        const cliente = await Cliente.findById(id);
        if (!cliente) throw new Error('Cliente no encontrado');
        if (cliente.vendedor.toString() !== ctx.usuario.id) throw new Error('No tienes las credenciales');
        return cliente;
      } catch (error) {
        console.log(error);
        throw new Error('Error al obtener el cliente');
      }
    }
  },
  Mutation: {
    nuevoUsuario: async (_, { input }) => {
      const { email, password } = input;
      const existeUsuario = await Usuario.findOne({ email });
      if (existeUsuario) throw new Error('El usuario ya está registrado');

      const salt = await bcryptjs.genSalt(10);
      input.password = await bcryptjs.hash(password, salt);

      try {
        const usuario = new Usuario(input);
        await usuario.save();
        return usuario;
      } catch (error) {
        console.log(error);
        throw new Error('Error al crear el usuario');
      }
    },
    autenticarUsuario: async (_, { input }) => {
      const { email, password } = input;
      const existeUsuario = await Usuario.findOne({ email });
      if (!existeUsuario) throw new Error('El usuario no existe');

      const passwordCorrecto = await bcryptjs.compare(password, existeUsuario.password);
      if (!passwordCorrecto) throw new Error('El password es incorrecto');

      return { token: crearToken(existeUsuario, process.env.SECRETA, '24h') };
    },
    nuevoProducto: async (_, { input }) => {
      try {
        const producto = new Producto(input);
        return await producto.save();
      } catch (error) {
        console.log(error);
        throw new Error('Error al crear el producto');
      }
    },
    actualizarProducto: async (_, { id, input }) => {
      try {
        const producto = await Producto.findById(id);
        if (!producto) throw new Error('Producto no encontrado');

        return await Producto.findOneAndUpdate({ _id: id }, input, { new: true });
      } catch (error) {
        console.log(error);
        throw new Error('Error al actualizar el producto');
      }
    },
    eliminarProducto: async (_, { id }) => {
      try {
        const producto = await Producto.findById(id);
        if (!producto) throw new Error('Producto no encontrado');

        await Producto.findOneAndDelete({ _id: id });
        return "Producto eliminado";
      } catch (error) {
        console.log(error);
        throw new Error('Error al eliminar el producto');
      }
    },
    nuevoCliente: async (_, { input }, ctx) => {
      if (!ctx.usuario) throw new Error('No autenticado');
      const { email } = input;
      const clienteExistente = await Cliente.findOne({ email });
      if (clienteExistente) throw new Error('Cliente ya registrado');

      const nuevoCliente = new Cliente(input);
      nuevoCliente.vendedor = ctx.usuario.id;

      try {
        return await nuevoCliente.save();
      } catch (error) {
        console.log(error);
        throw new Error('Error al guardar el cliente');
      }
    },
    actualizarCliente: async (_, { id, input }, ctx) => {
      if (!ctx.usuario) throw new Error('No autenticado');

      let cliente = await Cliente.findById(id);
      if (!cliente) throw new Error('No existe el cliente');
      if (cliente.vendedor.toString() !== ctx.usuario.id) throw new Error('No tienes las credenciales');

      try {
        return await Cliente.findByIdAndUpdate(id, input, { new: true });
      } catch (error) {
        console.log(error);
        throw new Error('Error al actualizar el cliente');
      }
    }
  }
};

module.exports = resolvers;
