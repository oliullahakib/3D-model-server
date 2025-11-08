// dependance
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
var admin = require("firebase-admin");
var serviceAccount = require("./firebase-sdk-key.json");

const app = express();
const port = process.env.PORT || 3000

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});


// middleware
app.use(cors())
app.use(express.json())
// custom middleware 
const verifyFirebaseToken = async(req, res, next) => {
    const authorization = req.headers.authorization
    if (!authorization) {
        return res.status(401).send({ message: "Unauthorize access" })
    }
    const token = authorization.split(' ')[1]
    if (!token) {
        return res.status(401).send({ message: "Unauthorize access" })
    }
    // vrifyToken 
    try {
        const decode = await admin.auth().verifyIdToken(token)
        req.token_email = decode.email
        next()
    } catch {
        return res.status(401).send({ message: "Unauthorize access" })
    }

}
// public api 
app.get('/', (req, res) => {
    res.send("server is running")
    req.headers
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
        const downlodCollection = db.collection("downlods")
        // model api 

        app.get('/models', async (req, res) => {
            const result = await modelCollection.find().toArray()
            res.send(result)
        })
        app.get('/my-models', verifyFirebaseToken, async (req, res) => {
            const category = req.query.category;
            const email = req.query.email;
            if(req.token_email!==email){
                return res.status(403).send("Forbidden Access")
            }
            let filter = {}
            if (category) {
                filter = { category: category }
            }
            if (email) {
                filter = { created_by: email }
            }
            const result = await modelCollection.find(filter).toArray()
            res.send(result)
        })
        

        app.get('/recent-model', async (req, res) => {
            const result = await modelCollection.find().sort({ created_at: -1 }).limit(6).toArray()
            res.send(result)
        })
        app.get('/model-details/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await modelCollection.findOne(query)
            res.send(result)
        })
        app.post('/models', async (req, res) => {
            const newModel = req.body;
            const result = await modelCollection.insertOne(newModel)
            res.send(result)
        })
        app.put('/models/:id', async (req, res) => {
            const id = req.params.id
            const newModel = req.body
            const query = { _id: new ObjectId(id) }
            const update = {
                $set: newModel
            }
            const result = await modelCollection.updateOne(query, update)
            res.send(result)
        })
        app.delete('/models/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await modelCollection.deleteOne(query)
            res.send(result)
        })

        // downlod api 
        app.get('/my-downloads', verifyFirebaseToken, async (req, res) => {
            const email = req.query.email;
            if(req.token_email!==email){
                return res.status(403).send("Forbidden Access")
            }
            let filter = {}
            if (email) {
                filter = { created_by: email }
            }
            const result = await downlodCollection.find(filter).toArray()
            res.send(result)
        })
        app.post('/downlod/:id',async(req,res)=>{
            const newDownlod = req.body;
            const result= await downlodCollection.insertOne(newDownlod)

            // inc dwonlod count 
            const id = req.params.id
            const query={_id:new ObjectId(id)}
            const update={
                $inc:{downloads:1}
            }
            const dwonlodCount= await modelCollection.updateOne(query,update)
            res.send({result,dwonlodCount})
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