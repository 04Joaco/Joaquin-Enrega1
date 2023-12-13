import express from "express";
import ProductManager from "./ProductManager.js";
import fs from 'fs';

const app = express();
const PORT = 8080;
const productManager = new ProductManager("data/products.json", "data/carts.json");


app.use(express.json());

app.get("/api/products", async (req, res) => {
    try {
        const { limit } = req.query;
        let products = await productManager.getProducts();

        if (!limit) {
            res.status(200).send({
                success: true,
                data: products,
            });
        }

        products = products.filter(product => product.id <= limit);

        res.status(200).send({
            success: true,
            data: products,
        });
    } catch (error) {
        console.log("Error", error);
        res.status(400).send({
            success: false,
        });
    }
});

app.get("/api/products/:pid", async (req, res) => {
    try {
        const { pid } = req.params;
        if (isNaN(pid)) {
            throw new Error("ID no es un numero");
        }
        const product = productManager.getProductById(pid);

        if (!product) {
            throw new Error("ID no corresponde");
        }

        res.status(200).send({
            success: true,
            data: product,
        });
    } catch (error) {
        console.log("Error", error);
        res.status(400).send({
            success: false,
        });
    }
});

app.post("/api/products", (req, res) => {
    try {
        const { title, description, code, price, stock, category, thumbnails } = req.body;

        if (!title || !description || !code || !price || !stock || !category) {
            throw new Error("Todos los campos son obligatorios, excepto thumbnails");
        }

        const id = productManager.generateUniqueId();

        const newProduct = {
            id,
            title,
            description,
            code,
            price,
            status: true,
            stock,
            category,
            thumbnails: thumbnails || [],
        };

        productManager.addProduct(newProduct);

        res.status(201).send({
            success: true,
            message: "Producto agregado exitosamente",
            data: newProduct,
        });
    } catch (error) {
        console.log("Error", error);
        res.status(400).send({
            success: false,
            message: error.message || "Error al agregar el producto",
        });
    }
});

app.put("/api/products/:pid", (req, res) => {
    try {
        const { pid } = req.params;
        const updatedProductData = req.body;

        if (isNaN(pid)) {
            throw new Error("ID no es un numero");
        }

        productManager.updateProduct(pid, updatedProductData);

        res.status(200).send({
            success: true,
            message: `Producto con ID ${pid} actualizado exitosamente`,
        });
    } catch (error) {
        console.log("Error", error);
        res.status(400).send({
            success: false,
            message: error.message || "Error al actualizar el producto",
        });
    }
});

app.delete("/api/products/:pid", (req, res) => {
    try {
        const { pid } = req.params;

        if (isNaN(pid)) {
            throw new Error("ID no es un numero");
        }

        productManager.deleteProduct(pid);

        res.status(200).send({
            success: true,
            message: `Producto con ID ${pid} eliminado exitosamente`,
        });
    } catch (error) {
        console.log("Error", error);
        res.status(400).send({
            success: false,
            message: error.message || "Error al eliminar el producto",
        });
    }
});

// Rutas para carritos
const cartRouter = express.Router();
app.use("/api/carts", cartRouter);

cartRouter.post("/", (req, res) => {
    try {
        const cartId = productManager.generateUniqueId();
        const newCart = {
            id: cartId,
            products: [],
        };

        const cartsData = fs.readFileSync("carts.json", 'utf8');
        const carts = JSON.parse(cartsData);
        carts.push(newCart);
        const updatedCartsData = JSON.stringify(carts, null, 2);
        fs.writeFileSync("carts.json", updatedCartsData, 'utf8');

        res.status(201).send({
            success: true,
            message: "Nuevo carrito creado exitosamente",
            data: newCart,
        });
    } catch (error) {
        console.log("Error", error);
        res.status(400).send({
            success: false,
            message: error.message || "Error al crear el carrito",
        });
    }
});

cartRouter.get("/:cid", (req, res) => {
    try {
        const { cid } = req.params;
        const cartsData = fs.readFileSync("carts.json", 'utf8');
        const carts = JSON.parse(cartsData);
        const cart = carts.find(cart => cart.id === cid);

        if (!cart) {
            throw new Error("Carrito no encontrado");
        }

        res.status(200).send({
            success: true,
            data: cart.products,
        });
    } catch (error) {
        console.log("Error", error);
        res.status(400).send({
            success: false,
            message: error.message || "Error al obtener los productos del carrito",
        });
    }
});

cartRouter.post("/:cid/product/:pid", (req, res) => {
    try {
        const { cid, pid } = req.params;
        const { quantity } = req.body;

        if (isNaN(quantity)) {
            throw new Error("La cantidad debe ser un número");
        }

        const cartsData = fs.readFileSync("carts.json", 'utf8');
        const carts = JSON.parse(cartsData);
        const cart = carts.find(cart => cart.id === cid);

        if (!cart) {
            throw new Error("Carrito no encontrado");
        }

        const product = productManager.getProductById(pid);

        if (!product) {
            throw new Error("Producto no encontrado");
        }

        const existingProduct = cart.products.find(cartProduct => cartProduct.id === pid);

        if (existingProduct) {
            existingProduct.quantity += quantity;
        } else {
            cart.products.push({
                id: pid,
                quantity: quantity,
            });
        }

        const updatedCartsData = JSON.stringify(carts, null, 2);
        fs.writeFileSync("carts.json", updatedCartsData, 'utf8');

        res.status(201).send({
            success: true,
            message: `Producto con ID ${pid} agregado al carrito ${cid} exitosamente`,
        });
    } catch (error) {
        console.log("Error", error);
        res.status(400).send({
            success: false,
            message: error.message || "Error al agregar el producto al carrito",
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

