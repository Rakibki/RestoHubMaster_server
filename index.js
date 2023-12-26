const express = require('express')
const cors = require('cors')
const port = process.env.PORT || 5000 
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const app = express()
const stripe = require("stripe")('sk_test_51OO1NxG080f7o8KkvbRUkThpwIKzih0JvPovvB2JGvu1lyQnEk3wIEhl4KyZdl8n1r73dFcnHhwUZ6gzI1UCNV5v00u0VNhW9t');

// const formData = require('form-data');
// const Mailgun = require('mailgun.js');
// const mailgun = new Mailgun(formData);
// const mg = mailgun.client({username: 'api', key: "70cea413afcac4dcbcba5427e206b75c-07f37fca-3d303d39"});


app.use(express.json())
app.use(cookieParser())


app.get('/', (req, res) => {
    res.send("RestrohubMaster server is running")
})

const uri = `mongodb+srv://Restaurant_Management:9kP1hmQ8tqXlRzz8@cluster0.sinogwr.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5000',
    'https://obnoxious-value.surge.sh',
    'https://some-sandy.vercel.app',
    'https://server-khaki-eight.vercel.app',
    'https://restaurant-management-931c4.firebaseapp.com',
    'https://server-rakibki.vercel.app', 
    'https://restaurant-management-931c4.web.app',
    'https://wet-scale.surge.sh',
    'assorted-part.surge.sh'
  ],
  credentials: true
}))



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
    const database = client.db("DB_Restaurant_Management");
    const food_food_collection = database.collection("all_food");
    const All_Oder = database.collection("All_Oder");
    const Users = database.collection("Users");
    const TableBooks = database.collection("TableBooks");
    const cards = database.collection("Cards");
    const Payments = database.collection("Payments");
    const wishList = database.collection("wishList");


    // stripe start
  app.post("/createPayment", async (req, res) => {
  const { price } = req.body;
  const ammout = parseInt(price * 100) 
  const paymentIntent = await stripe.paymentIntents.create({
    amount: ammout,
    currency: "usd",
    payment_method_types: ["card"],
  })
    res.send({
    clientSecret: paymentIntent.client_secret,
   });
  })


  app.post("/payment/:email", async(req, res) => {
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const email = req.params?.email
    const date = req.body;
    const paymentInfo = {
      ...date,
      paymentDay: daysOfWeek[new Date().getDay()]
    }
    const options = {upsert: true};
    const result1 = await Payments.insertOne(paymentInfo)

    const result2 = await Users.findOneAndUpdate({email: email},  { $inc: { oder: 1 } }, options)
    res.send({result1, result2})
  })

// stripe end


  app.post('/withList/:email', async(req, res) => {
    const food = req.body;
    const email = req.params.email;
    const data = {
      ...food,
      email: email
    }
    const result = await wishList.insertOne(data)
    res.send(result)
  })


    app.get("/myPaymentHistory/:email", async(req, res) => {
      const email = req.params.email;
      const filter = {email: email}
      const result = await Payments.find(filter).toArray()
      res.send(result)
    })

    app.get("/myWishList/:email", async(req, res) => {
      const email = req.params.email;
      const filter = {email: email}
      const result = await wishList.find(filter).toArray()
      res.send(result)
    })

    app.get("/user/:email", async(req, res) => {
      const email = req.params.email;
      const filter = {email: email}
      const result = await Users.findOne(filter)
      res.send(result)
    })

    app.get("/allOders", async(req, res) => {
      const result = await Payments.find().toArray()
      res.send(result)
    })

    app.post('/card', async (req, res) => {
      const food = req.body;
      const result = await cards.insertOne(food)
      res.send(result)
    })

    app.get("/myCardLength/:email", async (req, res) => {
      const email = req.params.email
      const filter = {email: email};
      const result = await cards.countDocuments(filter)
      res.send({result}) 
    })

    app.delete("/myWishList/:id", async (req, res) => {
      const id = req?.params?.id;
      const filter = {_id: id}
      const result = await wishList.deleteOne(filter)
      res.send(result)
    })

    app.delete("/myCard/:id", async (req, res) => {
      const foodId = req.params?.id;
      const filter = {_id: new ObjectId(foodId)}
      const result = await cards.deleteOne(filter)
      res.send(result)
    })

    app.get("/myCard/:email", async (req, res) => {
      const email = req?.params?.email
      const filter = {email: email};
      const result = await cards.find(filter).toArray();
      res.send(result)
    })

    app.put("/subscribers", async(req, res) => {
      const data = req.body;
      const filter = {email: data?.email}
      const user = await Users.findOne(filter)
      if(!user) {
        return res.send("something")
      }
      const options = {upsert: true};
      const updateDocument = {
        $set: {
          ...user,
          subscribers: true
        }
      };
      const result = await Users.findOneAndUpdate(filter, updateDocument, options)
    })

    app.post("/addAbookTable", async (req, res) => {
      const bookData = req.body
      const result = await TableBooks.insertOne(bookData)
      res.send(result)
    })

    app.get("/myBookTable/:email", async (req, res) => {
      const email = req.params.email
      const filter = {email: email}
      console.log(email);
      const result = await TableBooks.find(filter).toArray()
      res.send(result)
    })

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

    app.get("/my_added_food", async (req, res) => {
      const email = req.query.email

      // if(req.user.userEmail.email !== email) {
      //   return res.status(403).send("unauthorized")
      // }

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

    app.get('/my_oder_food', async (req, res) => {
      const email = req.query.email;

      const query = { buyer_email : email };
      const result = await All_Oder.find(query).toArray()
      res.send(result)
    })

    app.delete("/my_Oder_food_delete/:id", async(req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) };
      const result = await Payments.deleteOne(query);
      res.send(result)
    })

    app.post('/users', async (req, res) => {
      const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const data = req.body;
      const user = {
        ...data,
        oder: 0,
        createIt: new Date().toDateString(),
        createDay: daysOfWeek[new Date().getDay()]
      }
      const filter = {email: data?.email};
      const isExting = await Users.findOne(filter);
      if(isExting) {
        return res.send({message: "Already userd Email"})
      }else {
        const result = await Users.insertOne(user);
        res.send(result)
      }
    })

   app.get("/getRole/:email", async(req, res) => {
    const email = req?.params?.email;
    const filter = {email: email}
    const user = await Users.findOne(filter)
    const role = {role: user?.role}
    res.send({role})
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

    app.get("/foods", async(req, res) => {
      const result = await food_food_collection.find().toArray();
      res.send(result)
    })

    app.get("/ManageTable", async(req, res) => {
      const result = await TableBooks.find().toArray();
      res.send(result)
    })

    app.get("/customers", async(req, res) => {
      const result = await Users.find().toArray();
      res.send(result)
    })

    app.get("/adminHome", async (req, res) => {
      const payments = await Payments.find().toArray()
      const revenues = payments.reduce((acc, curr) => acc + curr?.totalPrice, 0)
      const foods = await food_food_collection.estimatedDocumentCount();
      const customers = await Users.estimatedDocumentCount();
      const oders = await Payments.estimatedDocumentCount();
      res.send({revenues, foods, customers, oders})
    })


    app.get("/foodChrt", async (req, res) => {
      const Appetizers = await food_food_collection.countDocuments({category: 'Appetizers'})
      const Breakfast = await food_food_collection.countDocuments({category: 'Breakfast'})
      const Desserts = await food_food_collection.countDocuments({category: 'Desserts'})
      const FamilyDishes = await food_food_collection.countDocuments({category: 'Family Dishes'})
      res.send({Appetizers, Breakfast, Desserts, FamilyDishes});
    })

    
  app.get("/topFiveTransactions", async (req, res) => {
    const result = await Payments.find().sort({_id: -1}).limit(5).toArray()
    res.send(result)
  })

  app.get("/dayAnalytics", async (req, res) => {
    const userSunday = await Users.countDocuments({'createDay': 'Sunday'})
    const userMonday = await Users.countDocuments({'createDay': 'Monday'})
    const userTuesday = await Users.countDocuments({'createDay': 'Tuesday'})
    const userWednesday = await Users.countDocuments({'createDay': 'Wednesday'})
    const userThursday = await Users.countDocuments({'createDay': 'Thursday'})
    const userFriday = await Users.countDocuments({'createDay': 'Friday'})
    const userSaturday = await Users.countDocuments({'createDay': 'Saturday'})

    const paymentSunday = await Payments.countDocuments({'paymentDay': 'Sunday'})
    const paymentMonday = await Payments.countDocuments({'paymentDay': 'Monday'})
    const paymentTuesday = await Payments.countDocuments({'paymentDay': 'Tuesday'})
    const paymentWednesday = await Payments.countDocuments({'paymentDay': 'Wednesday'})
    const paymentThursday = await Payments.countDocuments({'paymentDay': 'Thursday'})
    const paymentFriday = await Payments.countDocuments({'paymentDay': 'Friday'})
    const paymentSaturday = await Payments.countDocuments({'paymentDay': 'Saturday'})
    
    const userResigterDay = {userSunday, userMonday, userTuesday, userWednesday, userThursday, userFriday, userSaturday}
    const oderDay = {paymentSaturday, paymentFriday, paymentThursday, paymentWednesday, paymentTuesday, paymentMonday, paymentSunday}

    res.send({userResigterDay, oderDay})
  })

  app.get("/categoryFoodQuentity", async (req, res) => {
    const Appetizers = await food_food_collection.countDocuments({category: 'Appetizers'})
    const Breakfast = await food_food_collection.countDocuments({category: 'Breakfast'})
    const Desserts = await food_food_collection.countDocuments({category: 'Desserts'})
    const FamilyDishes = await food_food_collection.countDocuments({category: 'Family Dishes'})
    res.send({Appetizers, Breakfast, Desserts, FamilyDishes})
  })

  app.get("/AllDelivaryMan", async (req, res) => {
    const filter = {role: 'deliveryMan'}
    const result = await Users.find(filter).toArray();
    res.send(result)
  })

  app.delete("/oder/:id", async (req, res) => {
    const id = req.params?.id;
    const filter = {_id: new ObjectId(id)}
    const result = await Payments.deleteOne(filter)
    res.send(result)
  })

  app.put("/selectDelivaryMan", async(req, res) => {
    const deliveryManId = req.query?.selectedDeliverManId;
    const selectOderId = req.query?.selectOderId;
    const date = req.query?.date;

    const options = { upsert: true };
    const filter = {_id: new ObjectId(selectOderId)}
    const result = await Payments.findOneAndUpdate(filter, {
      $set: {
        status: "OnTheWay",
        deviveryManId: deliveryManId,
        deliveryDate: date
      }
    }, options)
    res.send(result)
  })

  app.delete("/food-delete/:id", async(req, res) => {
    const id = req.params.id;
    const filter = {_id: new ObjectId(id)}
    const result = await food_food_collection.deleteOne(filter)
    res.send(result)
  })

  app.put("/update-food/:id", async(req ,res) => {
    const foodInfo = req.body;
    const foodId = req.params.id
    const result = await food_food_collection.findOneAndUpdate({_id: new ObjectId(foodId)}, {$set: {
      Food_name: foodInfo?.Food_Name,
      Price: foodInfo?.Price,
      quectity: foodInfo?.Quentity,
      category: foodInfo?.Categoty
    }})
    res.send(result)
  })

  app.delete("/table/:id", async(req, res) => {
    const id = req?.params?.id;
    const filter = {_id: new ObjectId(id)}
    const result = await TableBooks.deleteOne(filter)
    res.send(result)
  })

  app.get('/delivery-list/:id', async(req, res) => {
    const deliveryManId = req?.params?.id;
    const filter = {deviveryManId: deliveryManId}
    const result = await Payments.find(filter).toArray();
    res.send(result)
  })


  app.put('/delivery-list/:id', async(req, res) => {
    const foodId = req.params.id;
    const filter = {_id: new ObjectId(foodId)}
    const result = await Payments?.findOneAndUpdate(filter, {
      $set: {
        deviveryManId: null,
        status: "cancel"
      }
    });
    res.send(result)
  })

  app.put('/namageDeliveryList/:id', async(req, res) => {
    const id = req.params.id;
    const filter = {_id: new ObjectId(id)}
    console.log(filter);
    const result = await Payments.findOneAndUpdate(filter, {
      $set: {
        status: 'diliverd'
      }
    })
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