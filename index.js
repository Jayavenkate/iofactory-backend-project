import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import auth from "./middleware/auth.js";
dotenv.config();

const PORT = 4000;
const app = express();

//mongodb
const MONGO_URL = "mongodb+srv://jaya:jaya123@cluster0.q8ola8v.mongodb.net";
const client = new MongoClient(MONGO_URL);
await client.connect();
console.log("The Mongo is connected");
app.use(express.json());
app.use(cors());

app.get("/", function (req, res) {
  res.send(" hello world io factory");
});

//signup

async function generateHashedPassword(password) {
  const NO_OF_ROUNDS = 10;
  const salt = await bcrypt.genSalt(NO_OF_ROUNDS);
  const hashedpassword = await bcrypt.hash(password, salt);
  console.log(salt);
  console.log(hashedpassword);
  return hashedpassword;
}

app.post("/signup", async function (req, res) {
  try {
    const { name, email, password } = req.body;
    const userFromDb = await client
      .db("b42wd2")
      .collection("iouser")
      .findOne({ email: email });
    if (userFromDb) {
      res.status(401).send({ message: "email already exist" });
    } else {
      const hashedpassword = await generateHashedPassword(password);
      const result = await client.db("b42wd2").collection("iouser").insertOne({
        name: name,
        email: email,
        password: hashedpassword,
      });
      res.status(200).send(result);
    }
  } catch (err) {
    res.send({ message: "err" });
  }
});
//login

app.post("/login", async function (req, res) {
  try {
    const { email, password } = req.body;
    const userFromDb = await client
      .db("b42wd2")
      .collection("iouser")
      .findOne({ email: email });
    if (!userFromDb) {
      res.status(400).send({ message: "invalid credential" });
    } else {
      const storedPassword = userFromDb.password;
      const ispasswordcheck = await bcrypt.compare(password, storedPassword);
      if (ispasswordcheck) {
        const token = jwt.sign({ id: userFromDb._id }, process.env.SECRET_KEY);
        console.log(token);
        res.send({ message: "Login Successfully", token: token });
      } else {
        res.status(400).send({ message: "invalid credential" });
      }
    }
  } catch (err) {
    res.send({ message: "err" });
  }
});
//create

app.post("/createmovie", async function (req, res) {
  try {
    const data = req.body;
    const { movieName } = data;
    const existmovie = await client
      .db("b42wd2")
      .collection("iofactory")
      .findOne({ movieName: movieName });
    if (existmovie) {
      res.status(400).send({ message: " This movie already exist" });
    } else {
      let movie = {
        ...data,
      };
      console.log("newmovie", movie);
      const result = await client
        .db("b42wd2")
        .collection("iofactory")
        .insertOne(data);
      res.status(200).send(result);
      console.log(result);
    }
  } catch (err) {
    res.status(400).send({ message: "err" });
  }
});
//getdata

app.get("/getmovie", async function (req, res) {
  try {
    const result = await client
      .db("b42wd2")
      .collection("iofactory")
      .find({})
      .toArray();
    res.status(200).send(result);
    console.log(result);
  } catch (err) {
    res.status(400).send({ message: "err" });
  }
});

//getbyid

app.get("/getmovie/:id", async function (req, res) {
  const { id } = req.params;
  const result = await client
    .db("b42wd2")
    .collection("iofactory")
    .findOne({ _id: new ObjectId(id) });
  console.log(result);
  result ? res.send(result) : res.send({ message: "user not found" });
});

//delete

app.delete("/delete/:id", async function (req, res) {
  try {
    const { id } = req.params;
    const result = await client
      .db("b42wd2")
      .collection("iofactory")
      .deleteOne({ _id: new ObjectId(id) });
    console.log(result);
    result.deletedCount >= 1
      ? res.send({ message: "delete successfully" })
      : res.send({ message: "user not found" });
  } catch (err) {
    res.send({ message: "err" });
  }
});

//update

app.put("/edit/:id", async function (req, res) {
  try {
    const { id } = req.params;
    const newdata = req.body;
    const result = await client
      .db("b42wd2")
      .collection("iofactory")
      .updateOne({ _id: new ObjectId(id) }, { $set: newdata });
    if (result.matchedCount === 1) {
      res.send({ message: "update successfully" });
    } else {
      res.status(404).send({ message: "user not found" });
    }
  } catch (err) {
    res.send({ message: "err" });
  }
});
app.listen(PORT, () => console.log(`The port is running ${PORT}`));
