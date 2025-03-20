import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import sql from "./configurations/db.js";

//routing imports
import kitchensRoutes from './routes/kitchens.routes.js';

const app = express();

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.get('/kitchens', kitchensRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});