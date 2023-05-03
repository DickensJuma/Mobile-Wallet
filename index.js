const express = require('express');
const mongoose = require('mongoose');
const bodyparser = require('body-parser');
const app = express();
const users = require('./src/routes/users');
const wallet = require('./src/routes/transactions');
const morgan = require('morgan');

const port = 3000;
require('dotenv').config()
 

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error(err));

app.use(express.json());
app.use(bodyparser.urlencoded({ extended: false }));
app.use(morgan('dev'));

app.use('/api/users', users);
app.use('/api/tx', wallet)



app.listen(port, () => console.log(`Server running on port ${port}`));
