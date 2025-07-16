import cors from "cors";
import express from "express";
import sequelize from "./config/database.js";
import materialRoutes from "./routes/materials.js";
import sectionRoutes from "./routes/sections.js";
const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/materials", materialRoutes);
app.use("/sections", sectionRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Database sync and server start
sequelize
  .sync({ force: false })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error("Unable to connect to the database:", err);
  });
