// File: src/index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const grammarCheckerRoutes = require('./routes/grammarCheckerRoutes');
const quizRoutes = require('./routes/quizRoutes');
const materiRoutes = require('./routes/materialRoutes');
const progressRoutes = require('./routes/progressRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes'); 
const userRoutes = require('./routes/userRoutes'); // Tambahkan routes user
const app = express();
const cookieParser = require('cookie-parser');
app.use(cookieParser()); // ⬅️ pasang di awal

app.use(express.json());

app.use(express.json({ limit: '10mb' })); // atau bahkan 20mb jika perlu
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
}));

app.use(express.json()); // Untuk mem-parsing body JSON

// Gunakan routes grammar checker
app.use('/api/grammar', grammarCheckerRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/materi', materiRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/user', userRoutes); // Tambahkan routes user
//app.listen(5000, () => console.log('Server running on port 5000'));

//const grammarRoutes = require("./routes/grammarRoutes");


//app.use("/api/grammar", grammarRoutes);

// Port & Listener
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
