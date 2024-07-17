const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const studentRoutes = require('./routes/scores');
const cors = require('cors')

const app = express();
app.use(bodyParser.json());
app.use(cors)

mongoose.connect('mongodb+srv://nguyhonglong2002:VoCm3fdhVCDf9vwK@cluster0.zokt7pa.mongodb.net/thpt?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });

// Sử dụng route cho sinh viên
app.use('/students', studentRoutes);

// Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
