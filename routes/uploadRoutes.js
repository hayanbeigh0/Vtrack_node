const express = require("express");
const multer = require("multer");
const path = require("path");
const mongoose = require("mongoose");

const router = express.Router();

const imageSchema = new mongoose.Schema({
  filename: String,
  data: Buffer, // Store image data as Buffer
  contentType: String,
});

const Image = mongoose.model("Image", imageSchema);

const storage = multer.memoryStorage(); // Use memory storage to store file in memory
const upload = multer({ storage: storage });

let requestCount = 0;

router.post("/image", upload.single("image"), async (req, res) => {
  console.log("uploading image...");

  // Increment the request count
  requestCount++;

  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  // Positive response for the first request
  if (requestCount === 1 || requestCount === 5) {
    if (requestCount === 5) {
      requestCount = 0;
    }
    const newImage = new Image({
      filename: req.file.originalname,
      data: req.file.buffer, // Use file buffer as image data
      contentType: req.file.mimetype,
    });

    // Save the image to MongoDB
    // await newImage.save();
    return res.status(200).json({
      message: "Uploaded",
      messageCode: "UPLOADED",
    });
    // return res
    //   .status(200)
    //   .send(`File uploaded: <img src="/image/${newImage._id}" />`);
  }

  // Reject the next 3 requests with different reasons
  if (requestCount <= 4) {
    let message;
    let messageCode;
    switch (requestCount) {
      case 2:
        message = "Insufficient light";
        messageCode = "INL";
        break;
      case 3:
        message = "Couldn't verify";
        messageCode = "CV";
        break;
      case 4:
        message = "Go to Home Screen";
        messageCode = "GTH";
        break;
    }
    return res.status(400).json({ message, messageCode });
  }

  // After 4 requests, reset the request count
  requestCount = 0;
});

router.get("/image/:id", async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) {
      return res.status(404).send("Image not found");
    }

    res.set("Content-Type", image.contentType);
    res.send(image.data);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to fetch image");
  }
});
router.post("/save-image", upload.single("image"), async (req, res) => {
  console.log("uploading image...");
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  const newImage = new Image({
    filename: req.file.originalname,
    data: req.file.buffer, // Use file buffer as image data
    contentType: req.file.mimetype,
  });

  await newImage.save();
  // res.status(400).json(null);
  res.status(200).send(`File uploaded: <img src="/image/${newImage._id}" />`);
});

router.get("/image/:id", async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) {
      return res.status(404).send("Image not found");
    }

    res.set("Content-Type", image.contentType);
    res.send(image.data);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to fetch image");
  }
});

module.exports = router;
