import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { generateImagesWithStreaming, textStreaming } from "./image_gen";
import { performInpainting } from "./inpaint";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3001;

// Middleware for parsing JSON with increased payload size for images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files
app.use(express.static("."));
app.use("/images", express.static("images"));

// Redirect root to canvas page
app.get("/", (req, res) => {
    res.redirect("/canvas");
});

app.get("/canvas", (req, res) => {
    res.sendFile(path.join(__dirname, "canvas.html"));
});

app.get("/generate", async (req, res) => {
    await generateImagesWithStreaming(res);
});

app.post("/api/stream", async (req, res) => {
    const { prompt } = req.body;
    await textStreaming(res, prompt);
});

app.post("/api/inpainting", async (req, res) => {
    await performInpainting(req, res);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Canvas tool available at http://localhost:${port}/canvas`);
});