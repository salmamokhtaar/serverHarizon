const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User'); // Import User model
const Contact = require('./models/Contact');
const cors = require('cors');
dotenv.config();

const app = express();
app.use(express.json()); // Middleware to parse JSON bodies
app.use(cors());
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB successfully'))
  .catch((error) => console.error('MongoDB connection error:', error));

// Signup Route
app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error });
  }
});

// Login Route
app.post('/login', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Find user by either username or email
    const user = await User.findOne({ $or: [{ username }, { email }] });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
});

// Contact Route
app.post('/api/contact', async (req, res) => {
  const { name, email, phone, message } = req.body;

  const newContact = new Contact({
    name,
    email,
    phone,
    message,
    status: 'Pending' // Set default status to Pending
  });

  try {
    await newContact.save();
    res.status(201).json({ message: 'Contact saved successfully!' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save contact', details: error });
  }
});

// Get All Contacts Route
app.get('/api/contacts', async (req, res) => {
  try {
    const contacts = await Contact.find();
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contacts', details: error });
  }
});

// Get Total Number of Contacts Route
app.get('/api/contacts/count', async (req, res) => {
  try {
    const count = await Contact.countDocuments();
    res.json({ totalContacts: count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contact count', details: error });
  }
});

// Get Single Contact by ID Route
app.get('/api/contacts/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const contact = await Contact.findById(id);
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }
    res.json(contact);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contact', details: error });
  }
});
// Get All Users Route
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users', details: error });
  }
});
// Update User by ID Route
app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { username, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { username, email, password: hashedPassword },
      { new: true, runValidators: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User updated successfully', updatedUser });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user', details: error });
  }
});

// Delete User by ID Route
app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user', details: error });
  }
});



// Delete Contact by ID Route
app.delete('/api/contacts/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deletedContact = await Contact.findByIdAndDelete(id);
    if (!deletedContact) {
      return res.status(404).json({ message: 'Contact not found' });
    }
    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete contact', details: error });
  }
});

// Update Contact by ID Route
app.put('/api/contacts/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, message } = req.body;

  try {
    const updatedContact = await Contact.findByIdAndUpdate(
      id,
      { name, email, phone, message },
      { new: true, runValidators: true }
    );
    if (!updatedContact) {
      return res.status(404).json({ message: 'Contact not found' });
    }
    res.json({ message: 'Contact updated successfully', updatedContact });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update contact', details: error });
  }
});

// Update Contact Status by ID Route
app.put('/api/contacts/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const updatedContact = await Contact.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );
    if (!updatedContact) {
      return res.status(404).json({ message: 'Contact not found' });
    }
    res.json({ message: 'Status updated successfully', updatedContact });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status', details: error });
  }
});

// Get Report Data Route
app.get('/api/reports', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalContacts = await Contact.countDocuments();
    const completedContacts = await Contact.countDocuments({ status: 'Completed' });
    const pendingContacts = await Contact.countDocuments({ status: 'Pending' });

    const reportData = {
      totalUsers,
      totalContacts,
      completedContacts,
      pendingContacts,
    };

    res.json(reportData);
  } catch (error) {
    console.error('Error fetching report data:', error);
    res.status(500).json({ error: 'Failed to fetch report data', details: error });
  }
});

// Get Total Number of Users Route
app.get('/api/users/count', async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ totalUsers: count });
  } catch (error) {
    console.error('Error fetching user count:', error);
    res.status(500).json({ error: 'Failed to fetch user count', details: error });
  }
});

// Get Single User by ID Route
app.get('/api/users/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user', details: error });
  }
});

// Get All Completed Contacts Route
app.get('/api/contacts/completed', async (req, res) => {
  try {
    const completedContacts = await Contact.find({ status: 'Completed' });
    res.json(completedContacts);
  } catch (error) {
    console.error('Error fetching completed contacts:', error);
    res.status(500).json({ error: 'Failed to fetch completed contacts', details: error });
  }
});

// Get All Pending Contacts Route
app.get('/api/contacts/pending', async (req, res) => {
  try {
    const pendingContacts = await Contact.find({ status: 'Pending' });
    res.json(pendingContacts);
  } catch (error) {
    console.error('Error fetching pending contacts:', error);
    res.status(500).json({ error: 'Failed to fetch pending contacts', details: error });
  }
});


// Test Route
app.get('/test', (req, res) => {
  res.send('Server is running and routes are set up!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});