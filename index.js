const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectID} = require('mongodb');
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.prtsl.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const uri = `mongodb+srv://foysal:Foysal890@cluster0.prtsl.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        await client.connect();
        const productCollection = client.db('zoho').collection('products');

        //get first 6 products
        app.get('/homeProducts', async (req, res) => {
            const products = await productCollection.find({}).limit(6).toArray();
            res.send(products);
        });

        //get product by id
        app.get('/product/:id', async (req, res) =>{
            const id = req.params.id;
            const query = {_id: ObjectID(id)};
            const product = await productCollection.findOne(query);
            res.send(product);
        });

        //update product quantity
        // app.put('/product/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const query = {_id: ObjectID(id)};
        //     const product = await productCollection.findOne(query);
        //     const newQuantity = req.body.quantity;
        //     const newProduct = {...product, quantity: newQuantity};
        //     await productCollection.replaceOne(query, newProduct);
        //     res.send(newProduct);
        // })


        //reduce product quantity by 1
        app.put('/product/:id', async (req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectID(id)};
            const product = await productCollection.findOne(query);
            const newQuantity = product.quantity - 1;
            const newProduct = {...product, quantity: newQuantity};
            await productCollection.replaceOne(query, newProduct);
            res.send(newProduct);
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

