// dependance
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

const app = express();
const port = process.env.PORT || 3000

// middleware
app.use(cors())
app.use(express.json())

// public api 
app.get('/', (req, res) => {
    res.send("server is running")
})
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.wfr9cox.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const db = client.db("3D-model")
        const modelCollection = db.collection("model")
        // model api 

        app.get('/models',async(req, res) => {
            const query = req.query.category;
            console.log(query)
            let filter = {}
            if(query){
                filter = {category:query}
            }
            const result = await modelCollection.find(filter).toArray()
            res.send(result)
        })
        app.get('/recent-model',async(req, res) => {
            const result = await modelCollection.find().sort({ created_at:-1}).limit(6).toArray()
            res.send(result)
        })
        app.get('/model-details/:id',async(req,res)=>{
            const id = req.params.id;
            const query = {_id:new ObjectId(id)}
            const result = await modelCollection.findOne(query)
            res.send(result)
        })
        app.post('/models',async(req,res)=>{
            const newModel=req.body;
            const result = await modelCollection.insertOne(newModel)
            res.send(result)
        })
        app.put('/models/:id',async(req,res)=>{
            const id = req.params.id
            const newModel=req.body
            const query = {_id:new ObjectId(id)}
            const update = {
                $set:newModel
            }
            const result = await modelCollection.updateOne(query,update)
            res.send(result)
        })
        app.delete('/models/:id',async(req,res)=>{
            const id = req.params.id
            const query = {_id:new ObjectId(id)}
            const result = await modelCollection.deleteOne(query)
            res.send(result)
        })
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`server is running on port ${port}`)
})