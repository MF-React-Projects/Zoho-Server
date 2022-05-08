const express = require("express");
const cors = require("cors");
const jwt = require('jsonwebtoken');
const {MongoClient, ServerApiVersion, ObjectID} = require('mongodb');
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

const varifyJWT = (req, res, next) => {
    const token = req.headers.authorization.split(' ')[1];
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).send({
                    message: 'Invalid Token'
                });
            }
            req.decoded = decoded;
            next();
        });
    } else {
        return res.status(401).send({
            message: 'Unauthorized access'
        });
    }
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.prtsl.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1});

async function run() {
    try {
        await client.connect();
        const productCollection = client.db('zoho').collection('products');

        //auth
        app.post('/login', (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.JWT_SECRET, {
                expiresIn: '7d'
            });
            res.send({
                accessToken
            });
        });

        //get first 6 products
        app.get('/homeProducts', async (req, res) => {
            const products = await productCollection.find({}).limit(6).toArray();
            res.send(products);
        });

        //get all products
        app.get('/products', async (req, res) => {
            const products = await productCollection.find({}).toArray();
            res.send(products);
        });

        //get products by user email
        app.get('/myProducts', varifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
            if(decodedEmail === email) {
                const products = await productCollection.find({userEmail: email}).toArray();
                res.send(products);
            } else {
                res.send({
                    message: 'Unauthorized access'
                })
            }
        });

        //get product by id
        app.get('/product/:id', async (req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectID(id)};
            const product = await productCollection.findOne(query);
            res.send(product);
        });

        //update product quantity
        app.put('/product/:id', async (req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectID(id)};
            const product = await productCollection.findOne(query);
            const newQuantity = req.body.quantity;
            const newProduct = {...product, quantity: newQuantity};
            await productCollection.replaceOne(query, newProduct);
            res.send(newProduct);
        });

        //delete product
        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectID(id)};
            const result = await productCollection.deleteOne(query);
            res.send(result);
        });

        //add product
        app.post('/products', async (req, res) => {
            const product = req.body;
            const result = await productCollection.insertOne(product);
            res.send(result);
        });

        //edit product
        app.put('/product/edit/:id', async (req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectID(id)};
            const product = await productCollection.findOne(query);
            const newProduct = req.body;
            const newProductWithId = {...product, ...newProduct};
            await productCollection.replaceOne(query, newProductWithId);
            res.send(newProductWithId);
        });

    } finally {
        // await client.close();
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Running on port ' + port);
});

app.listen(port, () => {
    console.log('Server running on port ' + port);
});

