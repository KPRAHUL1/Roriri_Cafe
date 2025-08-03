import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const app: Express = express();
const host = process.env.APP_HOST || 'localhost';
const port = process.env.APP_PORT || 7700;

app.use(express.json());
app.use(express.urlencoded());

//Express configuration.
app.set("host", host);
app.set("port", port);

//Using custom cors policy
app.use((req, res, next) => {
  res.append('Access-Control-Allow-Origin', '*');
  res.append('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
  res.append('Access-Control-Allow-Headers', '*');
  next();
});


app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});


const qrApi = require('./modules/scan/scan.route');
const userApi = require('./modules/user/user.route');
const adminAuthApi = require('./modules/admin/admin.route');
const productApi = require('./modules/product/product.route');
const purchaseApi = require("./modules/purchase/purchase.route");
const  transactionApi = require('./modules/transaction/transaction.route')
const tokenApi = require('./modules/token/token.route')
const orderApi = require('./modules/user/[userId]/orderhistory.route');


app.use('/api', qrApi);
app.use('/api/users', userApi);
app.use('/api/admin-auth', adminAuthApi);
app.use('/api/products',productApi)
app.use("/api/purchases", purchaseApi);
app.use('/api/transactions', transactionApi);
app.use('/api/tokens', tokenApi);
app.use('/api',orderApi);

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.listen(app.get("port"), () => {
  console.log(
    "Server started at %s : %d ",
    app.get("host"),
    app.get("port"),
  );
});

module.exports = app;
 