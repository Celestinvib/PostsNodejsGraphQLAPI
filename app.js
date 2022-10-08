const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const { graphqlHTTP } = require('express-graphql');


const graphqlSchema = require('./graphql/schema');
const graphqlResolver = require('./graphql/resolvers');

const auth = require('./middleware/is-auth');
const { clearImage } = require('./util/file');
const app = express();
 
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: function(req, file, cb) {
        cb(null, uuidv4() + '-' + file.originalname);
      }
});

const fileFilter = (req, file, cb) => {
    if(
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg' 
    ) {
        cb(null,true);
    }else {
        cb(null,false);
    }
}



// app.use(bodyParser.urlencoded()); //x-www-form-urlencoded <form>
app.use(bodyParser.json()); //application/json <- app that send and recive json data

app.use(
    multer({ storage: fileStorage, fileFilter: fileFilter}).single('image')
);

//Path join will created an absolute path to allow the user to see the images saved on the server
app.use('/images', express.static(path.join(__dirname, 'images')));

//Cors Configuration
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
      'Access-Control-Allow-Methods',
      'OPTIONS, GET, POST, PUT, PATCH, DELETE'
    );
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if( req.method === 'OPTIONS') { //For options request never make it to the graphql route but get a good response (bc the options method is not allowed in graphql only GET & POST) 
      return res.sendStatus(200);
    }
    next();
  });

app.use(auth);

app.put('/post-image', (req,res,next) => {
  if(!req.isAuth) {
    throw new Error('Not authenticated!')
  }

  if(!req.file) {
    return res.status(200).json({ message: 'No file provided! '});
  }

  if(req.body.oldPath) {
    clearImage(req.body.oldPath);
  }
  console.log(req.file.path);
  return res.status(201).json({ message: 'File stored.', filePath: req.file.path.replace('\\', '/') })
})


//Setting the only 'route' 
app.use(
  '/graphql',
  graphqlHTTP({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    /* The line below 
    Allows to use the engine to see the query, mutation.. and creates some at the spot 
    -> 'http://localhost:8080/graphql' (have to be a query defined on the schema)
    */
    graphiql: true,
    customFormatErrorFn(err){ //Allows to get errs and edit the display of them
      if(!err.originalError) {  //An error throw by the server
        return err;
      }
      const data = err.originalError.data;
      const message = err.message || 'An error ocurred.'; 
      const code = err.originalError.code || 500; //With the pipes if code is not null 500 will be returned in its place
      return { message: message, status: code, data: data }; 
    }
  })
);

//Error handling middleware
app.use((error, req, res,next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    res.status(status).json({message: message, data: data});
});

const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.dwn83ww.mongodb.net/${process.env.MONGO_DB}?retryWrites=true`;

mongoose
  .connect(MONGODB_URI)
  .then(result => {
   app.listen(process.env.PORT || 8080); //The server we create at port 8080 ('http')
})
  .catch(err => {
    console.log(err);
  });

