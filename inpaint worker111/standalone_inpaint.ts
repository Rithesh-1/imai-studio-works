import { standaloneInpainting } from "./inpaint";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        // Run with default parameters
        console.log("Running with default parameters...");
        await standaloneInpainting(
            "Changer/Remover or inspire image",
            "original_image.png",
            "image_mask.png",
            "lounge.png"
        );
    } else if (args.length === 4) {
        // Run with custom parameters
        const [prompt, imagePath, maskPath, outputPath] = args;
        console.log(`Running with custom parameters:`);
        console.log(`Prompt: ${prompt}`);
        console.log(`Image: ${imagePath}`);
        console.log(`Mask: ${maskPath}`);
        console.log(`Output: ${outputPath}`);
        
        await standaloneInpainting(prompt, imagePath, maskPath, outputPath);
    } else {
        console.log("Usage:");
        console.log("  npm run edit                    # Run with default parameters");
        console.log("  npm run edit \"prompt\" \"image.png\" \"mask.png\" \"output.png\"  # Run with custom parameters");
        console.log("  tsx standalone_inpaint.ts       # Direct execution with defaults");
        console.log("  tsx standalone_inpaint.ts \"prompt\" \"image.png\" \"mask.png\" \"output.png\"  # Direct execution with custom params");
    }
}

main().catch(console.error); 