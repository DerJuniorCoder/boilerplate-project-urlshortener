require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
//The MongoClient class is a class that allows for making Connections to MongoDB
const { MongoClient } = require("mongodb");
const dns = require("dns");
//We can use the url module for parsing. It is one of the core Node.js module. So, we don't have to install it using NPM.
const urlparser = require("url");

const client = new MongoClient(process.env.DB_URL);
//Create a new Db instance sharing the current socket connections. The Db class is a class that represents a MongoDB Database.
const db = client.db("urlshortner");
//Returns a reference to a MongoDB Collection. If it does not exist it will be created implicitly.
const urls = db.collection("urls");

//Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
//The express.urlencoded() function is a built-in middleware function in Express. It parses incoming requests with URL-encoded payloads and is based on a body parser.
app.use(express.urlencoded({ extended: true }));


app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

//You can POST a URL to /api/shorturl and get a JSON response with original_url and short_url properties. Here's an example: { original_url : 'https://freeCodeCamp.org', short_url : 1}
app.post("/api/shorturl", (req, res) => {
  console.log(req.body);
  const url = req.body.url;

  //lookup the hostname passed as argument
  const dnslookup = dns.lookup(urlparser.parse(url).hostname,
    async (err, address) => {
      console.log(err);
      console.log(address);
      if (!address) {
        res.json({
          error: "invalid url"
        });
      } else {

        //Returns the count of documents that match the query for a collection or view.
        const urlCount = await urls.countDocuments({});
        const urlDoc = {
          url,
          short_url: urlCount
        };

        //Inserts a single document into a collection.
        const result = await urls.insertOne(urlDoc);
        console.log(result);
        res.json({
          original_url: url,
          short_url: urlCount
        });
      }

    });

});

//When you visit /api/shorturl/<short_url>, you will be redirected to the original URL.
app.get('/api/shorturl/:short_url', async (req, res) => {
  const shorturl = req.params.short_url;
  //Returns one document that satisfies the specified query criteria on the collection or view
  const urlDoc = await urls.findOne({short_url: +shorturl});
  res.redirect(urlDoc.url);
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

