# Inpaint Worker

An AI-powered image inpainting application using OpenAI's API for intelligent image editing.

## Features

- 🎨 **Interactive Canvas**: Create masks with real-time preview
- 🤖 **AI-Powered Inpainting**: Uses OpenAI GPT-4o for intelligent image editing
- 📸 **Reference Images**: Support for multiple reference images for style guidance
- 🔧 **Command Line Interface**: Batch processing capabilities
- 🌐 **Web Interface**: User-friendly web application
- 📊 **Real-time Streaming**: Live progress updates during generation

## Setup

### Prerequisites

- Node.js (v18 or higher)
- OpenAI API key

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the root directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=3001
   ```
   
   Get your OpenAI API key from: https://platform.openai.com/api-keys

3. **Create necessary directories:**
   ```bash
   mkdir temp generated
   ```

## Usage

### Web Application

1. **Start the server:**
   ```bash
   npm start
   ```

2. **Access the application:**
   - Main interface: http://localhost:3001
   - Canvas tool: http://localhost:3001/canvas

### Command Line Interface

**Run with default parameters:**
```bash
npm run edit
```

**Run with custom parameters:**
```bash
npm run edit "prompt" "image.png" "mask.png" "output.png"
```

**Direct execution:**
```bash
npx tsx standalone_inpaint.ts "prompt" "image.png" "mask.png" "output.png"
```

## API Endpoints

- `GET /` - Main interface
- `GET /canvas` - Canvas tool
- `GET /generate` - Image generation streaming
- `POST /api/stream` - Text streaming
- `POST /api/inpainting` - Inpainting API

## File Structure

```
📁 inpaint worker/
├── 📄 server.ts              # Express.js server
├── 📄 inpaint.ts             # Core inpainting functionality
├── 📄 image_gen.ts           # Image generation utilities
├── 📄 standalone_inpaint.ts  # CLI interface
├── 📄 index.html             # Main web interface
├── 📄 canvas.html            # Interactive canvas tool
├── 📄 package.json           # Dependencies
├── 📄 tsconfig.json          # TypeScript config
└── 📄 README.md              # This file
```

## Development

**Start in development mode with auto-reload:**
```bash
npm run dev
```

**Build TypeScript:**
```bash
npm run build
```

## Troubleshooting

1. **Missing OpenAI API key**: Ensure your `.env` file contains a valid API key
2. **Port already in use**: Change the PORT in your `.env` file
3. **Image processing errors**: Check that input images are valid and not corrupted
4. **Memory issues**: Large images may cause memory problems - the app automatically resizes images to fit API limits

## License

MIT 