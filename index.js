const express = require('express')
const cors = require('cors')
const port = process.env.PORT || 5000 
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()


const app = express()

app.use(express.json())
app.use(cors())


app.get('/', (req, res) => {
    res.send("server is running")
})


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.sinogwr.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();

    const database = client.db("DB_Restaurant_Management");
    const food_food_collection = database.collection("all_food");

    app.get('/all_foods', async (req, res) => {
      const result = await food_food_collection.find().toArray()
      res.send(result)
    })
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);


app.listen(port, () => {
    console.log(`server is running port ${port}`);
})