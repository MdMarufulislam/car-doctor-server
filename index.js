const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app=express();
const port= process.env.PORT || 5000

app.use(cors({
  origin:["https://car-doctor-five.vercel.app"],
  credentials: true
}));
app.use(express.json())
app.use(cookieParser())

const verifyToken=(req, res, next)=>{
 const token= req?.cookies?.token;
  if(!token){
    return res.status(401).send({massage:"unauthoriged"})
  }
  jwt.verify(token, process.env.access_token, (err, decoded)=>{
    if(err){
      return res.status(401).send({massage:"unauthoriged"})
    }
    req.user=decoded;
    next()
  })
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.9ccwjtx.mongodb.net/?retryWrites=true&w=majority`;

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

    const servicesCollection=client.db("carDoctor").collection("services");
    const bookingCollection=client.db("carDoctor").collection("booking")

    app.post("/jwt", async(req, res)=>{
      const user= req.body;
      console.log(user)
      
      const token=jwt.sign(user, process.env.access_token, { expiresIn: '1h' } )
      res
      .cookie('token', token, {
        httpOnly: true,
        secure: false,
      })
      .send({success: true})
    })


    app.get("/services", async(req, res)=>{
        const cursor=servicesCollection.find();
        const result= await cursor.toArray()
        res.send(result)
        

    })

    app.get("/services/:id", async(req, res)=>{
        const id= req.params.id;
        const querry= {_id: new ObjectId(id)}
        const options = {
            projection: {title: 1, img: 1, price:1, service_id:1 },
          };
        const result= await servicesCollection.findOne(querry, options);
        
        res.send(result)
    })
    app.get("/booking",verifyToken, async(req, res)=>{
      let querry={};
      console.log("User information:-" , req.user)
      if(req.user.email !== req.query.email){
        return res.status(403).send({massage: 'forbidden'})
      }
      if(req.query?.email){
        querry={email: req.query.email}
      }
      const result= await bookingCollection.find(querry).toArray();
      res.send(result)
    })

    app.post("/booking", async(req, res)=>{
      const booking= req.body;
      const result= await bookingCollection.insertOne(booking)
      console.log(result)
      res.send(result)
      
    })






    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);


app.get("/", (req, res)=>{

    res.send("doctor is running")


})

app.listen(port, ()=>{
    console.log(`Car doctor surver is runnig on port: ${port}`)
})