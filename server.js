const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const { Document, Packer, Paragraph } = require("docx");
const { ScanCommand } = require("@aws-sdk/client-dynamodb");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const mammoth = require("mammoth");
const accessCode = Math.random().toString(36).substring(2, 8).toUpperCase();
const path = require('path');



// AWS SDK v3 Imports
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { DynamoDBClient, GetItemCommand, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { unmarshall } = require("@aws-sdk/util-dynamodb");

const app = express();
const PORT = 3000;

// ===== Middleware =====
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

app.use('/frontend', express.static(path.join(__dirname, 'app/frontend')));

// ===== AWS SDK v3 Configuration =====
const REGION = "us-east-1";
const BUCKET_NAME = "BUCKET_NAME";
const USERS_TABLE = "Users";
const DOCUMENTS_TABLE = "Documents";

const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: "ACCESSKEY", 
    secretAccessKey: "SKEY"
  }
});

const dynamoClient = new DynamoDBClient({
  region: REGION,
  credentials: {
    accessKeyId: "ACESSKEY",
    secretAccessKey: "S_KEY"
  }
});

// ===== Routes =====

// Health Check
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working" });
});

// ===== Signup =====
app.post("/api/signup", async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const userCheck = await dynamoClient.send(new GetItemCommand({
      TableName: USERS_TABLE,
      Key: { email: { S: email } }
    }));

    if (userCheck.Item) {
      return res.status(400).json({ message: "User already exists" });
    }

    await dynamoClient.send(new PutItemCommand({
      TableName: USERS_TABLE,
      Item: {
        email: { S: email },
        firstName: { S: firstName },
        lastName: { S: lastName },
        password: { S: password }
      }
    }));

    res.status(200).json({ message: "Signup successful" });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ===== Login =====
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  try {
    const userRes = await dynamoClient.send(new GetItemCommand({
      TableName: USERS_TABLE,
      Key: { email: { S: email } }
    }));

    const user = userRes.Item ? unmarshall(userRes.Item) : null;

    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    res.status(200).json({
      message: "Login successful",
      user: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});




// ===== Save Document =====
app.post("/api/save-document", async (req, res) => {
  try {
    const { docId, title, content, ownerEmail, timestamp } = req.body;

    if (!docId || !title || !content || !ownerEmail) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // ✅ Save raw HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `;

    // ✅ Upload HTML file to S3
    const s3Key = `documents/${docId}.html`;

    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: htmlContent,
      ContentType: "text/html",
    }));

    const s3Url = `https://${BUCKET_NAME}.s3.amazonaws.com/${s3Key}`;

    // ✅ Save metadata to DynamoDB
    await dynamoClient.send(new PutItemCommand({
      TableName: DOCUMENTS_TABLE,
      Item: {
        documentId: { S: docId },
        title: { S: title },
        ownerEmail: { S: ownerEmail },
        accessCode: { S: accessCode },
        collaborators: {
          L: [
            {
              M: {
                email: { S: ownerEmail },
                access: { S: "Both" },
              },
            },
          ],
        },
        content: { S: s3Url }, // ✅ Now links to HTML file
        timestamp: { S: timestamp },
        documentLink: {
          S: `http://127.0.0.1:5501/frontend/editor.html?docId=${docId}&title=${encodeURIComponent(title)}`
        },
      },
    }));

    res.status(200).json({ message: "Document saved", s3Url, accessCode});

  } catch (err) {
    console.error("Save Document Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// ========= Join Document =========== //

app.post("/api/join-document-by-access-code", async (req, res) => {
  const { accessCode, email } = req.body;

  if (!accessCode || !email) {
    return res.status(400).json({ error: "Access code and email are required" });
  }

  try {
    // 1. Scan for the document with matching access code
    const result = await dynamoClient.send(new ScanCommand({
      TableName: DOCUMENTS_TABLE,
    }));

    const matchingDoc = result.Items.find(item => item.accessCode?.S === accessCode);

    if (!matchingDoc) {
      return res.status(404).json({ error: "Invalid access code" });
    }

    const docId = matchingDoc.documentId.S;
    const title = matchingDoc.title.S;
    const s3Url = matchingDoc.content.S;

    // Check if user already a collaborator
    const collaborators = matchingDoc.collaborators.L;
    const alreadyCollaborator = collaborators.some(c => c.M.email.S === email);

    if (!alreadyCollaborator) {
      // Add new collaborator
      collaborators.push({
        M: {
          email: { S: email },
          access: { S: "Both" }
        }
      });

      // Update the document in DynamoDB
      await dynamoClient.send(new PutItemCommand({
        TableName: DOCUMENTS_TABLE,
        Item: {
          ...matchingDoc,
          collaborators: { L: collaborators }
        }
      }));
    }

    return res.status(200).json({
      message: "Access granted",
      documentId: docId,
      title: title,
      documentLink: `http://127.0.0.1:5500/frontend/editor.html?docId=${docId}&title=${encodeURIComponent(title)}`
    });

  } catch (err) {
    console.error("Join Document Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});






app.post("/api/user-documents", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Missing email" });

  try {
    const data = await dynamoClient.send(new ScanCommand({
      TableName: DOCUMENTS_TABLE
    }));

    const relevantDocs = data.Items.filter(item => {
      const ownerMatch = item.ownerEmail.S === email;
      const collaborators = item.collaborators?.L || [];
      const isCollaborator = collaborators.some(c => c.M.email.S === email);
      return ownerMatch || isCollaborator;
    });

    const formattedDocs = relevantDocs.map(doc => {
      const collaborators = (doc.collaborators?.L || []).map(c => ({
        email: c.M.email.S,
        access: c.M.access.S
      }));

      return {
        documentId: doc.documentId.S,
        title: doc.title.S,
        timestamp: doc.timestamp.S,
        ownerEmail: doc.ownerEmail.S,
        collaborators, 
        documentLink: doc.documentLink.S
      };
    });

    res.status(200).json({ documents: formattedDocs });
  } catch (err) {
    console.error("Fetch User Documents Error:", err);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});


// ====== Get Documents =======

app.get("/api/get-document", async (req, res) => {
  const docId = req.query.docId;

  if (!docId) {
    return res.status(400).json({ error: "Missing docId in query params" });
  }

  const params = {
    TableName: DOCUMENTS_TABLE,
    Key: {
      documentId: { S: docId },
    },
  };

  try {
    const command = new GetItemCommand(params);
    const result = await dynamoClient.send(command);

    if (!result.Item) {
      return res.status(404).json({ error: "Document not found" });
    }

    const title = result.Item.title?.S || "Untitled Document";
    const s3Url = result.Item.content.S;

    // Extract S3 key from stored URL
    const key = s3Url.split(`${BUCKET_NAME}.s3.amazonaws.com/`)[1];

    if (!key) {
      return res.status(500).json({ error: "Invalid S3 URL in DB" });
    }

    // Generate pre-signed URL (valid for 5 minutes)
    const getObjectCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, getObjectCommand, {
      expiresIn: 300, // seconds
    });

    const document = {
      documentId: docId,
      title,
      content: signedUrl,
    };

    res.status(200).json({ document });
  } catch (err) {
    console.error("Error fetching document from DynamoDB or S3:", err);
    res.status(500).json({ error: "Server error" });
  }
});




// ===== Start Server =====
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
