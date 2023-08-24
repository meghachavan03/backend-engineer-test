const express = require("express");
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

const port = 3000;

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'Backend'
});

db.connect((err)=>
{
  if(err)
  {
    console.warn("error");
  }
  else{
    console.warn("connected");
  }
}
);

// Multer storage configuration for images
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Middleware to handle JSON data
app.use(express.json());

// Create New Contact
app.post('/contacts', upload.single('image'), (req, res) => {
  const { firstName, lastName, email, phoneNumbers } = req.body;
console.log(req.file);
  // Insert contact into Contacts table
  const insertContactQuery = `
    INSERT INTO Contacts (FirstName, LastName, Email, ImageURL)
    VALUES (?, ?, ?, ?);
  `;

  db.query(insertContactQuery, [firstName, lastName, email, req.file.path], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Error creating contact.' });
    }

    const contactId = result.insertId;

    // Insert phone numbers into PhoneNumbers table
    const insertPhoneNumbersQuery = `
      INSERT INTO PhoneNumbers (ContactID, PhoneNumber)
      VALUES ?;
    `;

    const phoneNumbersData = phoneNumbers.map(number => [contactId, number]);

    db.query(insertPhoneNumbersQuery, [phoneNumbersData], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Error adding phone numbers.' });
      }

      res.status(201).json({ message: 'Contact created successfully.' });
    });
  });
});




// Delete Contact
app.delete('/contacts/:id', (req, res) => {
  const contactId = req.params.id;

  // Delete contact and associated phone numbers
  const deleteContactQuery = `DELETE FROM Contacts WHERE ContactID = ?`;
  const deletePhoneNumbersQuery = `DELETE FROM PhoneNumbers WHERE ContactID = ?`;

  db.query(deletePhoneNumbersQuery, [contactId], err => {
    if (err) {
      return res.status(500).json({ error: 'Error deleting phone numbers.' });
    }

    db.query(deleteContactQuery, [contactId], err => {
      if (err) {
        return res.status(500).json({ error: 'Error deleting contact.' });
      }

      res.json({ message: 'Contact deleted successfully.' });
    });
  });
});


// Fetch All Contacts
app.get('/contacts', (req, res) => {
  const fetchContactsQuery = `
    SELECT c.ContactID, c.FirstName, c.LastName, c.Email, c.ImageURL, GROUP_CONCAT(p.PhoneNumber) AS PhoneNumbers
    FROM Contacts c
    LEFT JOIN PhoneNumbers p ON c.ContactID = p.ContactID
    GROUP BY c.ContactID;
  `;

  db.query(fetchContactsQuery, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching contacts.' });
    }

    res.json(results);
  });
});



// Search Contacts by Name or Phone Number
app.get('/contacts/search', (req, res) => {
  const searchTerm = req.query.q;

  const searchContactsQuery = `
    SELECT c.ContactID, c.FirstName, c.LastName, c.Email, c.ImageURL, GROUP_CONCAT(p.PhoneNumber) AS PhoneNumbers
    FROM Contacts c
    LEFT JOIN PhoneNumbers p ON c.ContactID = p.ContactID
    WHERE c.FirstName LIKE ? OR c.LastName LIKE ? OR p.PhoneNumber LIKE ?
    GROUP BY c.ContactID;
  `;

  const searchValue = `%${searchTerm}%`;

  db.query(searchContactsQuery, [searchValue, searchValue, searchValue], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error searching contacts.' });
    }

    res.json(results);
  });
});

// Update Contact
app.put('/contacts/:id', upload.single('image'), (req, res) => {
  const contactId = req.params.id;
  const { firstName, lastName, email, phoneNumbers } = req.body;

  const updateContactQuery = `
    UPDATE Contacts
    SET FirstName = ?, LastName = ?, Email = ?, ImageURL = ?
    WHERE ContactID = ?;
  `;

  db.query(updateContactQuery, [firstName, lastName, email, req.file.path, contactId], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Error updating contact.' });
    }

    // Delete existing phone numbers for the contact
    const deletePhoneNumbersQuery = `DELETE FROM PhoneNumbers WHERE ContactID = ?`;

    db.query(deletePhoneNumbersQuery, [contactId], err => {
      if (err) {
        return res.status(500).json({ error: 'Error updating phone numbers.' });
      }

      // Insert updated phone numbers
      const insertPhoneNumbersQuery = `
        INSERT INTO PhoneNumbers (ContactID, PhoneNumber)
        VALUES ?;
      `;

      const phoneNumbersData = phoneNumbers.map(number => [contactId, number]);

      db.query(insertPhoneNumbersQuery, [phoneNumbersData], (err) => {
        if (err) {
          return res.status(500).json({ error: 'Error adding phone numbers.' });
        }

        res.json({ message: 'Contact updated successfully.' });
      });
    });
  });
});

// Serve images
app.use('/uploads', express.static('uploads'));

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});







app.get("/",(req,res)=>{
  res.send("hello");
})