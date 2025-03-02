const express = require('express');
require('dotenv').config()
const cloudinary=require('cloudinary').v2;
const cors=require('cors')
const { v4: uuidv4 } = require('uuid');
const jwt = require("jsonwebtoken");
const multer = require('multer');
const app= express();
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME, 
  api_key: process.env.CLOUD_KEY,        
  api_secret: process.env.CLOUD_SECRET
});
const port= process.env.PORT || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nu3ic.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

app.use(cors({
  origin: 'http://localhost:5173',  // Or your frontend's URL
}));
app.use(express.json());
const upload = multer({ storage: multer.memoryStorage() });
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

    const userCollection = client.db("linkshare").collection("users");
    const contactsCollection = client.db("linkshare").collection("contacts");
    const linksCollection = client.db("linkshare").collection("links");
 
    app.get('/',(req,res)=>{
        res.send('Server is running')
    })
    // backend code

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1hr",
      });
      res.send({ token });
    });
    // verify Token
    const verifyToken = (req, res, next) => {
      if (!req.headers.authorization) {
        return res.status(401).send("Forbidden Access");
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send("Forbidden Access");
        }
        req.decoded = decoded;
        next();
      });
    };

    // user store

    app.post("/users", async (req, res) => {
      const user = req.body;
      // insert email if user doesnt exists:
      // you can do this many ways (1. email unique, 2. upsert 3. simple checking)
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exists", insertedId: null });
      }
      const result = await userCollection.insertOne(user);
      console.log(user);
      res.send(result);
    });

    app.post('/upload', upload.single('file'), async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: 'No file uploaded' });
        }
    
        // Automatically detect file type based on MIME type
        const resourceType = req.file.mimetype.includes('image')
          ? 'image'
          : req.file.mimetype.includes('video')
          ? 'video'
          : req.file.mimetype.includes('pdf')
          ? 'raw'
          : null;
    
        if (!resourceType) {
          return res.status(400).json({ error: 'Unsupported file type' });
        }
    
        console.log("Uploading file:", req.file); // Log the file details
    
        cloudinary.uploader.upload_stream(
          { resource_type: resourceType },
          (error, uploadedFile) => {
            if (error) {
              console.error("Cloudinary upload error:", error);  // Log Cloudinary error
              return res.status(500).json({ error: error.message });
            }
    
            console.log("File uploaded successfully:", uploadedFile);  // Log the uploaded file info
            res.json({ fileUrl: uploadedFile.secure_url });
          }
        ).end(req.file.buffer);
      } catch (error) {
        console.error("Unexpected error during upload:", error);  // Log unexpected errors
        res.status(500).json({ error: error.message });
      }
    });
    
    app.post('/generate-link',verifyToken,async(req,res)=>{
      const data= req.body;
      const uniqueId = uuidv4();
      const uniqueURL = `https://example.com/link/${uniqueId}`;
      const newLink = {
        owner: data.owner,
        fileURL: data.fileURL,
        access: data.access,
        expirationDate: data.expirationDate,
        uniqueURL: uniqueURL,
      };
      try {
        // Insert the new link into the database collection
        const result = await linksCollection.insertOne(newLink);
        
        // Send the result back as the response
        res.status(201).send({ message: 'Link generated successfully', link: newLink.uniqueURL });
      } catch (error) {
        // If there's an error, send it back in the response
        console.error(error);
        res.status(500).send({ message: 'Error generating link', error: error.message });
      }
      
    })

//     app.get('/user/email', verifyToken, async (req, res) => {
//       try {
//           // Extract email from query
//           const email = req.query.email;
//           if (!email) {
//               return res.status(400).send({ message: "Email query parameter is required" });
//           }
  
//           // Query user by email
//           const userData = await userCollection.findOne({ email });
  
//           // If user not found, return 404
//           if (!userData) {
//               return res.status(404).send({ message: "User not found" });
//           }
  
//           // Send user data
//           res.send(userData);
//       } catch (error) {
//           console.error("Error fetching User Information:", error);
//           res.status(500).send({ message: "Internal Server Error" });
//       }
//   });
  

    // add task

    // app.post('/add-task',verifyToken, async(req,res)=>{
    //   const taskData=req.body;
    //   const timestamp=  new Date().toISOString().split('T')[0];
    //   const newtaskData= {...taskData,timestamp}
    //   const result= await tasksCollection.insertOne(newtaskData);
    //   const userEmail = req.decoded.email;

    // Log the add task action using email
    // const log = {
    //   userEmail: userEmail,
    //   action: 'ADD',
    //   taskId: result.insertedId,
    //   timestamp: new Date(),
    //   details: `Task added with title: ${taskData.title}`,
    // };
    // await activityLogCollection.insertOne(log);
    //   res.send(result)
    // })
    
// find task

// app.get('/tasks',  async (req, res) => {
//   try {
//     const query = req.query;
//     //console.log("Query received:", query);

//     const tasks = await tasksCollection.find(query).toArray();  
//     res.send(tasks);
//   } catch (error) {
//     console.error("Error fetching tasks:", error);
//     res.status(500).send({ message: "Internal Server Error" });
//   }
// });

//find a task by id

// app.get('/task/:id',verifyToken,async(req,res)=>{
//   const {id}= req.params;
//   const query = { _id: new ObjectId(id) };
//   const result= await tasksCollection.findOne(query);
//   res.send(result)
// })
//delete
// app.delete('/task/:id',verifyToken,async(req,res)=>{
//   const {id}= req.params;
//   const query = { _id: new ObjectId(id) };
//   const result= await tasksCollection.deleteOne(query);
//   const userEmail = req.decoded.email;  // Get user email from decoded token

//     // Log the delete task action using email
//     const log = {
//       userEmail: userEmail,
//       action: 'DELETE',
//       taskId: new ObjectId(id),
//       timestamp: new Date(),
//       details: `Task with ID ${id} deleted.`,
//     };

//     // Insert log into activityLogs collection
//     await activityLogCollection.insertOne(log);
//   res.send(result)
// })

app.post("/submit/contact", async (req, res) => {
  const contact = req.body;

  try {
    const result = await contactsCollection.insertOne(contact);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: "Error ", error });
  }
});





    console.log("Successfully connected to MongoDB!");
  } finally {
    
  }
}
run().catch(console.dir);


app.listen(port,()=>{
    console.log(`Server is running: http://localhost:${port}`)
})

console.log()