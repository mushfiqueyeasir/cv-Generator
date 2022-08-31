const express = require('express')
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express()
const port = process.env.PORT || 5000


app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@clusterprime.emiebxm.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// Java Web Token Verify
function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'UnAuthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access!' })
        }
        req.decoded = decoded;
        next();
    })
}


async function run(){

    try{
        await client.connect();
        const userInformationCollection = client.db('cv_generator').collection('userInformation');


        
        // Get specific User
        app.get('/:email',  async (req, res) => {
            const email = req.params.email
            const users = await userInformationCollection.findOne({ email: email });
            res.send(users);
        })

        // Get All UserInformation
        app.get('/', async(req,res)=>{
            const query ={};
            const cursor = userInformationCollection.find(query);
            const userInformation =  await cursor.toArray();
            res.send(userInformation);
        })


        // Add  and Update  User Information
        app.put('/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await userInformationCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '12h' })
            res.send({result,token});
        })
    }
    finally{

    }

}

run().catch(console.dir)



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})