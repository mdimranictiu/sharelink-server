const express = require('express');
require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const jwt = require("jsonwebtoken");
const multer = require('multer');
const app = express();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET
});

const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nu3ic.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const allowedOrigins = [
  "https://linkshare-979a6.web.app",
  "http://localhost:5173"
];

// Configure CORS to allow multiple origins
app.use(cors({
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true); // Allow the request if the origin is in the allowed list
    } else {
      callback(new Error("Not allowed by CORS")); // Reject the request if the origin is not allowed
    }
  },
  methods: "GET,POST,PUT,DELETE,PATCH",
  allowedHeaders: "Content-Type,Authorization"
}));

app.use(express.json());
const upload = multer({ storage: multer.memoryStorage() });

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

    app.get('/', (req, res) => {
      res.send('Server is running');
    });

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1hr" });
      res.send({ token });
    });

    // Verify Token
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

    // User store
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exists", insertedId: null });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.post('/upload', upload.single('file'), async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: 'No file uploaded' });
        }

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

        cloudinary.uploader.upload_stream(
          { resource_type: resourceType },
          (error, uploadedFile) => {
            if (error) {
              return res.status(500).json({ error: error.message });
            }

            res.json({ fileUrl: uploadedFile.secure_url });
          }
        ).end(req.file.buffer);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post('/generate-link', verifyToken, async (req, res) => {
      const data = req.body;
      const uniqueId = uuidv4();
      const uniqueURL = `https://linkshare-979a6.web.app/link/${uniqueId}`;
      const newLink = {
        owner: data.owner,
        fileURL: data.fileURL,
        access: data.access,
        expirationDate: data.expirationDate,
        uniqueURL: uniqueURL,
        views: data.views
      };
      try {
        const result = await linksCollection.insertOne(newLink);
        res.status(201).send({ message: 'Link generated successfully', link: newLink.uniqueURL });
      } catch (error) {
        res.status(500).send({ message: 'Error generating link', error: error.message });
      }
    });

    app.get('/verifylink/:id', async (req, res) => {
      const { id } = req.params;
      const linkData = await linksCollection.findOne({ uniqueURL: `https://linkshare-979a6.web.app/link/${id}` });

      if (!linkData) {
        return res.status(404).json({ message: "Link not found" });
      }

      const now = new Date();
      const expirationDate = new Date(linkData.expirationDate);

      if (now > expirationDate) {
        return res.status(410).json({ message: "Link expired" });
      }

      if (linkData.access === 'public') {
        await linksCollection.updateOne(
          { uniqueURL: `https://linkshare-979a6.web.app/link/${id}` },
          { $inc: { views: 1 } }
        );
        return res.json({ fileURL: linkData.fileURL });
      }

      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ message: "Unauthorized. Please log in." });
      }

      try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        await linksCollection.updateOne(
          { uniqueURL: `https://linkshare-979a6.web.app/link/${id}` },
          { $inc: { views: 1 } }
        );
        return res.json({ fileURL: linkData.fileURL });
      } catch (error) {
        return res.status(401).json({ message: "Invalid token." });
      }
    });

    app.get('/my-links/', verifyToken, async (req, res) => {
      const email = req.decoded.email;
      const result = await linksCollection.find({ owner: email }).toArray();
      res.send(result);
    });

    app.delete('/delete/link/:id', verifyToken, async (req, res) => {
      const { id } = req.params;
      const result = await linksCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.patch('/update-link', verifyToken, async (req, res) => {
      const { linkId, access } = req.body;
      if (!linkId || !access) {
        return res.status(400).json({ message: "linkId and access are required" });
      }

      if (!ObjectId.isValid(linkId)) {
        return res.status(400).json({ message: "Invalid linkId format" });
      }

      const updatedData = { $set: { access: access } };
      try {
        const result = await linksCollection.updateOne(
          { _id: new ObjectId(linkId) },
          updatedData
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ message: "Link not found" });
        }

        res.status(200).json({ message: "Link updated successfully", result });
      } catch (error) {
        res.status(500).json({ message: "Error updating link", error: error.message });
      }
    });

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } finally {
  }
}

run().catch(console.dir);
