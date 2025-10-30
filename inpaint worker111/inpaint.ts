import OpenAI, { toFile } from "openai";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Check if OpenAI API key is set
if (!process.env.OPENAI_API_KEY) {
    console.error("Error: OPENAI_API_KEY environment variable is not set.");
    console.error("Please create a .env file with your OpenAI API key:");
    console.error("OPENAI_API_KEY=your_api_key_here");
    process.exit(1);
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Sharp.js utility functions for image processing
async function ensurePng(inputBuffer: Buffer, outputPath: string): Promise<Buffer> {
    const image = sharp(inputBuffer);
    const metadata = await image.metadata();
    
    console.log(`📊 Image metadata: format=${metadata.format}, channels=${metadata.channels}, hasAlpha=${metadata.hasAlpha}, width=${metadata.width}, height=${metadata.height}`);
    
    // Check if image is too large for API (OpenAI has limits)
    const maxDimension = 2048;
    let processedImage = image;
    
    if (metadata.width && metadata.height && (metadata.width > maxDimension || metadata.height > maxDimension)) {
        console.log(`🔄 Resizing image from ${metadata.width}x${metadata.height} to fit API limits...`);
        processedImage = image.resize(maxDimension, maxDimension, {
            fit: 'inside',
            withoutEnlargement: true
        });
    }
    
    if (metadata.format !== "png") {
        console.log(`🔄 Converting ${metadata.format} to PNG...`);
        const pngBuffer = await processedImage.png().toBuffer();
        fs.writeFileSync(outputPath, pngBuffer);
        return pngBuffer;
    }
    
    // If already PNG, process and save
    const pngBuffer = await processedImage.png().toBuffer();
    fs.writeFileSync(outputPath, pngBuffer);
    return pngBuffer;
}

async function logPngMetadata(filePath: string, label: string) {
    const buffer = fs.readFileSync(filePath);
    const image = sharp(buffer);
    const metadata = await image.metadata();
    console.log(`${label} metadata:`, metadata);
}

// Create necessary directories
function ensureDirectories() {
    const dirs = ['temp', 'generated'];
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
    });
}

// Helper function to create file and get file ID
async function createFile(filePath: string): Promise<string> {
    const fileContent = fs.createReadStream(filePath);
    const result = await openai.files.create({
        file: fileContent,
        purpose: "vision",
    });
    return result.id;
}

// Helper function to encode image to base64
function encodeImage(filePath: string): string {
    const base64Image = fs.readFileSync(filePath, "base64");
    return base64Image;
}

export async function performInpainting(req: any, res: any) {
    console.log('🎨 Inpainting request received');
    const { 
        prompt, 
        imageData: imageDataBase64, 
        maskData: maskDataBase64, 
        referenceImages: referenceImagesBase64 = [] 
    } = req.body;
    
    if (!prompt || !imageDataBase64 || !maskDataBase64) {
        console.error('❌ Missing required data for inpainting');
        return res.status(400).json({ 
            success: false, 
            error: "Missing prompt, image data, or mask data" 
        });
    }

    console.log(`📝 Prompt received: "${prompt}"`);
    console.log(`📊 Main image data size: ${Math.round(imageDataBase64.length / 1024)}KB`);
    console.log(`📊 Mask data size: ${Math.round(maskDataBase64.length / 1024)}KB`);
    console.log(`📊 Reference images count: ${referenceImagesBase64.length}`);
    referenceImagesBase64.forEach((img: string, index: number) => {
        console.log(`📊 Reference image ${index + 1} size: ${Math.round(img.length / 1024)}KB`);
    });

    try {
        ensureDirectories();
        
        console.log('🔧 Step 1: Converting base64 data to buffers...');
        // Convert base64 data to buffers
        const imageBuffer = Buffer.from(imageDataBase64.split(',')[1], 'base64');
        const maskBuffer = Buffer.from(maskDataBase64.split(',')[1], 'base64');
        
        // Convert reference images data if provided
        const referenceImageBuffers: Buffer[] = [];
        referenceImagesBase64.forEach((imgBase64: string, index: number) => {
            const buffer = Buffer.from(imgBase64.split(',')[1], 'base64');
            referenceImageBuffers.push(buffer);
            console.log(`📦 Reference image ${index + 1} buffer size: ${Math.round(buffer.length / 1024)}KB`);
        });

        console.log(`📦 Main image buffer size: ${Math.round(imageBuffer.length / 1024)}KB`);
        console.log(`📦 Mask buffer size: ${Math.round(maskBuffer.length / 1024)}KB`);

        console.log('📁 Step 2: Creating temporary files for OpenAI API...');
        
        // Create temporary files
        const imagePath = path.join('temp', 'inpainting_image.png');
        const maskPath = path.join('temp', 'inpainting_mask.png');
        const referenceImagePaths: string[] = [];
        
        // Process images with Sharp.js (ensure PNG format, RGBA support, and optimal size)
        console.log('🔧 Step 3: Processing images with Sharp.js...');
        const processedImageBuffer = await ensurePng(imageBuffer, imagePath);
        const processedMaskBuffer = await ensurePng(maskBuffer, maskPath);
        
        // Process reference images if provided
        const processedReferenceImageBuffers: Buffer[] = [];
        for (let i = 0; i < referenceImageBuffers.length; i++) {
            const refImagePath = path.join('temp', `inpainting_reference_${i}.png`);
            referenceImagePaths.push(refImagePath);
            const processedBuffer = await ensurePng(referenceImageBuffers[i], refImagePath);
            processedReferenceImageBuffers.push(processedBuffer);
            console.log(`📏 Processed reference image ${i + 1} size: ${Math.round(processedBuffer.length / 1024)}KB`);
        }
        
        // Log file sizes for debugging
        console.log(`📏 Processed main image size: ${Math.round(processedImageBuffer.length / 1024)}KB`);
        console.log(`📏 Processed mask size: ${Math.round(processedMaskBuffer.length / 1024)}KB`);
        
        // Log metadata for debugging
        console.log('🔍 Step 4: Logging image metadata...');
        await logPngMetadata(imagePath, "Main Image");
        await logPngMetadata(maskPath, "Mask Image");
        referenceImagePaths.forEach((refPath, index) => {
            logPngMetadata(refPath, `Reference Image ${index + 1}`);
        });
        
        console.log('✅ Temporary files created successfully');

        // Call OpenAI API with multiple images using image generation
        console.log('🤖 Step 5: Calling OpenAI API with multiple images...');
        
        console.log(`📝 Prompt: "${prompt}"`);
        
        // Log what we're sending to the API
        console.log('📤 Sending to API:');
        console.log('  - Main image:', imagePath);
        console.log('  - Mask image:', maskPath);
        referenceImagePaths.forEach((refPath, index) => {
            console.log(`  - Reference image ${index + 1}:`, refPath);
        });
        
        // Prepare images for API call
        const mainImage = await toFile(fs.createReadStream(imagePath), null, {
            type: "image/png",
        });
        
        const maskImage = await toFile(fs.createReadStream(maskPath), null, {
            type: "image/png",
        });
        
        // Prepare reference images if provided
        let allImages = [mainImage];
        if (referenceImagePaths.length > 0) {
            const referenceImages = await Promise.all(
                referenceImagePaths.map(async (refPath) =>
                    await toFile(fs.createReadStream(refPath), null, {
                        type: "image/png",
                    })
                )
            );
            allImages = [...allImages, ...referenceImages];
        }
        
        // Prepare content array with main image and reference images
        const content: any[] = [
            {
                type: "input_text",
                text: prompt,
            },
            {
                type: "input_image",
                file_id: await createFile(imagePath),
            }
        ];

        // Add reference images to content
        for (const refPath of referenceImagePaths) {
            content.push({
                type: "input_image",
                file_id: await createFile(refPath),
            });
        }

        // Use the OpenAI responses API with image generation tool for inpainting
        const response = await openai.responses.create({
            model: "gpt-4o",
            input: [
                {
                    role: "user",
                    content: content,
                },
            ],
            tools: [
                {
                    type: "image_generation",
                    quality: "high",
                    input_image_mask: {
                        file_id: await createFile(maskPath),
                    },
                },
            ],
        });

        console.log('✅ OpenAI API response received');
        console.log('🔍 Response structure:', JSON.stringify(response, null, 2));

        // Extract generated image data from the responses API format
        let imageBase64 = null;
        
        const imageData = response.output
            .filter((output) => output.type === "image_generation_call")
            .map((output) => output.result);

        if (imageData.length > 0 && imageData[0]) {
            imageBase64 = imageData[0];
        }

        if (imageBase64) {
            console.log(`📊 Generated image base64 size: ${Math.round(imageBase64.length / 1024)}KB`);
        
            const generatedImageBuffer = Buffer.from(imageBase64, "base64");
            const outputPath = path.join("generated", "inpainted_image.png");
            
            fs.writeFileSync(outputPath, generatedImageBuffer);
            
            console.log(`✅ Generated image saved to: ${outputPath}`);

            // Clean up temporary files
            console.log('🧹 Step 7: Cleaning up temporary files...');
            fs.unlinkSync(imagePath);
            fs.unlinkSync(maskPath);
            
            // Clean up reference image files
            referenceImagePaths.forEach((refPath, index) => {
                if (fs.existsSync(refPath)) {
                    fs.unlinkSync(refPath);
                    console.log(`🧹 Reference image ${index + 1} temporary file cleaned up`);
                }
            });
            
            console.log('🧹 Temporary files cleaned up');

            // Return success response
            console.log('🎉 Inpainting completed successfully!');
            res.json({ 
                success: true, 
                message: "Inpainting completed successfully",
                filename: "inpainted_image.png",
                imageData: imageBase64
            });
        } else {
            console.error('❌ No image data in OpenAI response');
            console.error('Response structure:', JSON.stringify(response, null, 2));
            throw new Error("No image data received from OpenAI API");
        }

    } catch (error) {
        console.error("❌ Error during inpainting:", error);
        
        // Clean up temporary files on error
        try {
            const imagePath = path.join('temp', 'inpainting_image.png');
            const maskPath = path.join('temp', 'inpainting_mask.png');
            if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
            if (fs.existsSync(maskPath)) fs.unlinkSync(maskPath);
            
            // Clean up reference image files
            for (let i = 0; i < 10; i++) { // Clean up to 10 potential reference files
                const refPath = path.join('temp', `inpainting_reference_${i}.png`);
                if (fs.existsSync(refPath)) fs.unlinkSync(refPath);
            }
        } catch (cleanupError) {
            console.error("❌ Error cleaning up temporary files:", cleanupError);
        }
        
        res.status(500).json({ 
            success: false, 
            error: error instanceof Error ? error.message : "Unknown error occurred" 
        });
    }
}

// Standalone inpainting function for command-line use
export async function standaloneInpainting(prompt: string, imagePath: string, maskPath: string, outputPath: string) {
    try {
        console.log('🎨 Starting standalone inpainting...');
        
        // Check if files exist
        if (!fs.existsSync(imagePath)) {
            console.error(`${imagePath} not found`);
            return;
        }
        if (!fs.existsSync(maskPath)) {
            console.error(`${maskPath} not found`);
            return;
        }

        // Read files and convert to PNG
        const imageBuffer = fs.readFileSync(imagePath);
        const maskBuffer = fs.readFileSync(maskPath);
        
        // Always use converted files for upload
        const originalPng = await ensurePng(imageBuffer, "temp_original_image.png");
        const maskPng = await ensurePng(maskBuffer, "temp_image_mask.png");

        // Log metadata for debugging
        await logPngMetadata("temp_original_image.png", "Original PNG");
        await logPngMetadata("temp_image_mask.png", "Mask PNG");

        console.log("Files found and verified as PNG, proceeding with image edit...");

        // Use the OpenAI responses API with image generation tool for inpainting
        const response = await openai.responses.create({
            model: "gpt-4o",
            input: [
                {
                    role: "user",
                    content: [
                        {
                            type: "input_text",
                            text: prompt,
                        },
                        {
                            type: "input_image",
                            file_id: await createFile("temp_original_image.png"),
                        }
                    ],
                },
            ],
            tools: [
                {
                    type: "image_generation",
                    quality: "high",
                    input_image_mask: {
                        file_id: await createFile("temp_image_mask.png"),
                    },
                },
            ],
        });

        // Save the image to a file
        let imageBase64 = null;
        
        const imageData = response.output
            .filter((output) => output.type === "image_generation_call")
            .map((output) => output.result);

        if (imageData.length > 0 && imageData[0]) {
            imageBase64 = imageData[0];
        }

        if (imageBase64) {
            const imageBuffer = Buffer.from(imageBase64, "base64");
            fs.writeFileSync(outputPath, imageBuffer);
            console.log(`Image saved as ${outputPath}`);
        } else {
            console.error("No image data found in response", response);
        }
        
        // Clean up temporary files
        if (fs.existsSync("temp_original_image.png")) fs.unlinkSync("temp_original_image.png");
        if (fs.existsSync("temp_image_mask.png")) fs.unlinkSync("temp_image_mask.png");
        
    } catch (error) {
        console.error("Error:", error);
    }
} 