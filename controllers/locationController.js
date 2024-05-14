const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const catchAsync = require("../utils/catchAsync");
const Vehicle = require("../models/vehicleModel");

const vehicles = {}; // Map to store vehicle data and associated WebSocket servers

exports.createLocationSocketServer = () => {
  try {
    const server = http.createServer(app);
    const io = new Server(server);
    io.on("connection", (socket) => {
      // Join a room
      socket.on("joinVehicleRoom", async (data) => {
        try {
          console.log(data);
          const { roomId } = data;
          const vehicle = await Vehicle.findById(roomId);
          if (!vehicle) {
            console.log("no vehicle found!");
            return;
          } else {
            socket.join(roomId);
            io.to(roomId).emit("myVehicleRoom", "Hello from the room!!!");
          }
        } catch (e) {
          console.log(e);
        }
      });

      // Leave a room
      socket.on("leaveRoom", (roomId) => {
        socket.leave(roomId);
        console.log(`User left room ${roomId}`);
      });

      // Broadcast message to room
      socket.on("message", (data) => {
        const { roomId, message } = data;
        io.to(roomId).emit("message", message);
        console.log(`Message sent to room ${roomId}`);
      });

      // Send location to the vehicle room
      socket.on("sendLocation", (data) => {
        const { roomId, latitude, longitude } = data;
        io.to(roomId).emit("sendLocation", { latitude, longitude });
        console.log(`Location sent to room ${roomId}`);
      });

      // Handle client disconnection
      socket.on("disconnect", () => {
        console.log("A user disconnected");
      });
    });

    // Start the server
    const PORT = 3000;
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
    res.status(400).json({
      status: "success",
      message: `Server running on http://localhost:${PORT}`,
    });
  } catch (e) {}
};
