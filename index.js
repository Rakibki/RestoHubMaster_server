const express = require('express')
const cors = require('cors')
const port = process.env.PORT || 5000 
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')

const app = express()

app.use(express.json())
app.use(cookieParser())
app.use(cors({
  origin: [
    'https://restaurant-management-931c4.firebaseapp.com',
    'http://localhost:5173',
    'https://server-rakibki.vercel.app', 
    'https://restaurant-management-931c4.web.app'
  ],
  credentials: true
}))


app.get('/', (req, res) => {
    res.send("server is running 2222")
})


const uri = `mongodb+srv://Restaurant_Management:9kP1hmQ8tqXlRzz8@cluster0.sinogwr.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


const vavifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  if(!token) {
    return res.status(401).send("unauthorized")
  }

  jwt.verify(token, process.env.secret, (error, decoded) => {
    if(error) {
      return res.status(402).send("unauthorized")
    }
    req.user = decoded
    next()
  })
}

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
      const sort = req.query.sort
      const searchValue = req.query.searchValue

      const minValue = req.query.minValue
      const maxvalue = req.query.maxvalue


      let searchFilter = {}
      if(searchValue) {
        searchFilter['category'] = searchValue
      }

      const result = await food_food_collection.find(searchFilter)
      .sort({Price: sort })
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

    app.get("/my_added_food", vavifyToken, async (req, res) => {
      const email = req.query.email

      if(req.user.userEmail.email !== email) {
        return res.status(403).send("unauthorized")
      }

      const filter = { buyer_email: email };
      const result = await food_food_collection.find(filter).toArray()
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

    app.get('/my_oder_food', vavifyToken, async (req, res) => {
      const email = req.query.email;
      
      if(req.user.userEmail.email !== email) {
        return res.status(403).send("unauthorized")
      }

      const query = { buyer_email : email };
      const result = await All_Oder.find(query).toArray()
      res.send(result)
    })

    app.delete("/my_Oder_food_delete/:id", async(req, res) => {
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

    app.put("/my_food_update/:id", async (req, res) => {
      const data = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };

      const updateDoc = {
        $set: {
          Food_Name: data.Food_Name,
          Quentity: data.Quentity,
          Food_Origin: data.Food_Origin,
          image_URL: data.image_URL,
          Categoty: data.Categoty,
          Price: data.Price
        },
      };
      const result = await food_food_collection.updateOne(filter, updateDoc);
      res.send(result)
    })

    app.delete("/my_food_delete/:id", async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) };
      const result = await food_food_collection.deleteOne(query);
      res.send(result)
    })

    app.post('/jwt', (req, res) => {
      const userEmail = req.body;

      const token = jwt.sign({userEmail}, process.env.secret, { expiresIn: '1h' });
      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
      })
      res.send({success: true})
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