import fs from 'fs';

function generateUniqueId() {
    return Date.now().toString();
}

export default class ProductManager {
    constructor(productsFilePath, cartsFilePath) {
        this.products = [];
        this.productIdCounter = 1;
        this.productsPath = productsFilePath;
        this.cartsPath = cartsFilePath;
        this.loadProductsFromFile();
    }

    loadProductsFromFile() {
        try {
            const productData = fs.readFileSync(this.productsPath, 'utf8');
            this.products = JSON.parse(productData);
            if (Array.isArray(this.products) && this.products.length > 0) {
                this.productIdCounter = Math.max(...this.products.map(product => product.id)) + 1;
            }
        } catch (error) {
            console.error('Error al cargar productos desde el archivo:', error.message);
        }
    }

    saveProductsToFile() {
        try {
            const data = JSON.stringify(this.products, null, 2);
            fs.writeFileSync(this.productsPath, data, 'utf8');
        } catch (error) {
            console.error('Error al guardar productos en el archivo:', error.message);
        }
    }


    addProduct(productData) {
        if (!productData.title || !productData.description || !productData.price || !productData.code || !productData.stock || !productData.category) {
            console.error("Todos los campos son obligatorios");
            return;
        }

        const codeExists = this.products.some((product) => product.code === productData.code);
        if (codeExists) {
            console.error("Ya existe un producto con el mismo código");
            return;
        }

        productData.id = this.generateUniqueId();

        this.products.push(productData);
        this.saveProductsToFile();
        console.log(`Producto agregado: ${productData.title}`);
    }

    getProductById(id) {
        const product = this.products.find(product => product.id === id);

        if (product) {
            return product;
        } else {
            console.error("Producto no encontrado");
            return null;
        }
    }

    updateProduct(id, updatedProductData) {
        const index = this.products.findIndex(product => product.id === id);

        if (index !== -1) {
            // No actualizar o eliminar el ID
            updatedProductData.id = id;
            this.products[index] = { ...this.products[index], ...updatedProductData };
            this.saveProductsToFile();
            console.log(`Producto actualizado con ID ${id}`);
        } else {
            console.error("Producto no encontrado");
        }
    }

    deleteProduct(id) {
        const index = this.products.findIndex(product => product.id === id);

        if (index !== -1) {
            this.products.splice(index, 1);
            this.saveProductsToFile();
            console.log(`Producto eliminado con ID ${id}`);
        } else {
            console.error("Producto no encontrado");
        }
    }

    getProducts() {
        return this.products;
    }

    generateUniqueId() {
        return Date.now().toString();
    }
}

