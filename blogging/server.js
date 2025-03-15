const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost/blog-platform', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Schemas
const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String
});

const PostSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  comments: [{
    text: String,
    author: String,
    createdAt: { type: Date, default: Date.now }
  }]
});

const User = mongoose.model('User', UserSchema);
const Post = mongoose.model('Post', PostSchema);

// Authentication Middleware
const authenticate = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).send('Access denied');

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).send('Invalid token');
  }
};

// Routes
app.post('/api/register', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = new User({
      username: req.body.username,
      password: hashedPassword
    });
    await user.save();
    res.status(201).send('User created');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post('/api/login', async (req, res) => {
  const user = await User.findOne({ username: req.body.username });
  if (!user) return res.status(400).send('Invalid credentials');

  const validPass = await bcrypt.compare(req.body.password, user.password);
  if (!validPass) return res.status(400).send('Invalid credentials');

  const token = jwt.sign({ _id: user._id }, 'your_jwt_secret');
  res.header('Authorization', token).send(token);
});

app.post('/api/posts', authenticate, async (req, res) => {
  const post = new Post({
    title: req.body.title,
    content: req.body.content,
    author: req.user._id
  });
  await post.save();
  res.status(201).json(post);
});

app.get('/api/posts', async (req, res) => {
  const posts = await Post.find().populate('author', 'username');
  res.json(posts);
});

app.post('/api/posts/:id/comments', async (req, res) => {
  const post = await Post.findById(req.params.id);
  post.comments.push({
    text: req.body.text,
    author: req.body.author
  });
  await post.save();
  res.json(post);
});

app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  const posts = await Post.find({
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { content: { $regex: query, $options: 'i' } }
    ]
  });
  res.json(posts);
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));