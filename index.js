const express = require('express')
const cors = require('cors')
const port = process.env.PORT || 5000 
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    const All_Oder = database.collection("All_Oder");
    const Users = database.collection("Users");

    app.get('/all_foods', async (req, res) => {
      const size = parseInt(req.query.size)
      const page = parseInt(req.query.page)

      const result = await food_food_collection.find()
      .skip(page * size)
      .limit(size)
      .toArray()
      res.send(result)
    })

    app.get('/all_foods_lenth', async (req, res) => {
      const result = await food_food_collection.estimatedDocumentCount()
      res.send({result})
    })

    app.get('/product_details/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await food_food_collection.findOne(query);
      res.send(result)
    })

    app.get('/Top_Food', async (req, res) => {
      const result = await food_food_collection.find().sort({ count: -1 }).limit(6).toArray()
      res.send(result)
    })

    app.post('/add_food_item', async (req, res) => {
      const data = req.body;
      const result = await food_food_collection.insertOne(data);
      res.send(result)
    })

    app.get("/my_added_food", async (req, res) => {
      const email = req.query.email
      const query = { buyer_email: email };
      const result = await food_food_collection.find(query).toArray()
      res.send(result)
    })

    app.post("/All_oder/:id", async (req, res) => {
      const id = req.params.id;
      const BuyFood = { _id: new ObjectId(id) };
      const oderFood = await food_food_collection.findOne(BuyFood)

      const updateDoc = {
        $set: { 
          count: oderFood?.count + 1
        }
      }
      await food_food_collection.updateOne(BuyFood, updateDoc)


      const data = req.body;
      const result = await All_Oder.insertOne(data);
      res.send(result)
    })

    app.get('/my_oder_food', async (req, res) => {
      const email = req.query.email;
      const query = { buyer_email : email };
      const result = await All_Oder.find(query).toArray()
      res.send(result)
    })

    app.delete("/my_Oder_food_delete/:id", async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) };
      const result = await All_Oder.deleteOne(query);
      res.send(result)
    })

    app.post('/users', async (req, res) => {
      const user = req.body;
      const result = await Users.insertOne(user);
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