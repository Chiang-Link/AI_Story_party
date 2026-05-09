# Story Loom — AI-Powered Keyword Story Generator

A web application that generates AI-crafted stories from three keywords. Inspired by Van Gogh's *Starry Night*, the UI features a dreamy oil-painting aesthetic with swirling vortex animations and falling stars.

## Features

- **Keyword-based generation** — Enter 3 keywords and let AI weave them into a complete story
- **Style & length control** — Choose from Heartwarming, Dark, or Humorous styles, and Short, Medium, or Long lengths
- **Streaming output** — Stories appear word by word as they are generated
- **User editing area** — Modify or extend the generated story before saving
- **History sidebar** — Browse, click to revisit, or delete past stories; auto-saves on page close
- **Multi-model support** — Supports Zhipu GLM-4-Flash and DeepSeek V4 Flash
- **Responsive design** — Adapts to desktop and mobile with a drawer-style sidebar on phones
- **Van Gogh aesthetic** — Oil-painting gradients, swirling vortex, warm golden tones, and falling stars

## Getting Started

### 1. Open the app

Open `index.html` directly in a browser, or serve it with any static server:

```bash
# Python
python -m http.server 8080

# Node.js (npx)
npx serve .
```

### 2. Configure API Key

1. Click the **Settings button** (⚙️) in the top-right corner
2. Select your preferred model (GLM-4-Flash or DeepSeek V4 Flash)
3. Enter the corresponding API Key and click **Save**

### 3. Generate a story

- Type 3 keywords into the input fields, or click **Random** (🎲) for random keywords
- Select **style** and **length**
- Click **✨ Generate Story** (or press Enter)

## API Setup

### Zhipu GLM-4-Flash

1. Register at [bigmodel.cn](https://open.bigmodel.cn/)
2. Create an API key in the console
3. Paste it into the app settings (GLM section)

### DeepSeek V4 Flash

1. Register at [platform.deepseek.com](https://platform.deepseek.com/)
2. Create an API key
3. Paste it into the app settings (DeepSeek section)

> **Note:** API keys are stored in `localStorage` on your browser and are never sent to any server other than the respective AI provider.

## Project Structure

```
├── index.html    # Main HTML page
├── style.css     # Styling with Van Gogh-inspired theme
├── app.js        # Application logic
└── README.md     # This file
```

## Technical Details

- **Pure frontend** — No build tools or server-side code required
- **Streaming API** — Uses the SSE/streaming chat completion endpoint for real-time output
- **Persistence** — History and API keys stored via `localStorage`; current story state preserved across refreshes via `sessionStorage`
- **Responsive** — CSS media queries for mobile breakpoints at 768px

## License

MIT
