import express from 'express';
import route from './Routes/routes.js' // last me .js extension is imp nahi toh error milega
import cors from 'cors'
import bodyParser from "body-parser";

const app=express();

// Parse JSON-encoded bodies globally for all routes
app.use(bodyParser.json());

app.use(cors()); //use it before backend routing
app.use('/',route);

const PORT= process.env.PORT || 8000;

app.listen(PORT,()=>{
    console.log(`Server Running on Port-${PORT}`)
})

// run npm start to run