# React Frontend for Multi-Agent Code Generator

A modern React frontend built with TypeScript, Tailwind CSS, and React Query that provides a superior user experience compared to the Streamlit version.

## Features

- **Modern UI**: Clean, responsive design with dark mode support
- **Real-time Progress**: Live progress tracking with WebSocket fallback
- **Enhanced UX**: Better error handling, loading states, and user feedback
- **Mobile Responsive**: Works seamlessly on desktop, tablet, and mobile
- **Type Safety**: Full TypeScript support for better development experience
- **Performance**: Optimized with React Query for efficient data fetching

## Technology Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Query** for data fetching and caching
- **React Router** for navigation
- **Axios** for API communication
- **React Hook Form** for form handling
- **Lucide React** for icons

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend server running on http://localhost:8000

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to http://localhost:3000

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── layout/         # Layout components
│   │   ├── progress/       # Progress tracking components
│   │   └── results/        # Results display components
│   ├── pages/              # Page components
│   │   ├── CodeGenerator.tsx
│   │   ├── AgentInfo.tsx
│   │   └── ProjectHistory.tsx
│   ├── services/           # API services
│   │   └── api.ts
│   ├── types/              # TypeScript type definitions
│   │   └── api.ts
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── public/                 # Static assets
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## Key Components

### CodeGenerator
- Main interface for creating new projects
- Real-time input validation
- Progress tracking with smart completion detection
- Results display with download functionality

### ProgressTracker
- Real-time progress monitoring
- Adaptive polling intervals
- Smart UI generation detection
- Comprehensive error handling

### ResultsDisplay
- Tabbed interface for different result types
- Copy to clipboard functionality
- File download capabilities
- Syntax highlighting for code

### Layout
- Responsive sidebar navigation
- Backend health monitoring
- Dark mode support
- Mobile-friendly design

## API Integration

The frontend communicates with the FastAPI backend through a comprehensive API client that handles:

- Authentication and error handling
- Request/response interceptors
- Retry logic with exponential backoff
- Extended timeouts for long-running operations
- Smart completion detection

## Features Comparison with Streamlit

### Enhanced User Experience
- **Faster Performance**: No page reloads, instant navigation
- **Better Responsiveness**: Optimized for all screen sizes
- **Improved Error Handling**: Graceful error recovery and user feedback
- **Real-time Updates**: WebSocket support with polling fallback

### Advanced Functionality
- **Smart Progress Detection**: Intelligent completion checking
- **Enhanced File Management**: Better download and export options
- **Search and Filtering**: Advanced project history management
- **Keyboard Shortcuts**: Improved accessibility

### Modern Development
- **Type Safety**: Full TypeScript support
- **Component Architecture**: Reusable, maintainable components
- **State Management**: Efficient data caching and synchronization
- **Developer Experience**: Hot reload, better debugging

## Configuration

The frontend can be configured through environment variables:

- `VITE_API_BASE_URL` - Backend API URL (default: http://localhost:8000)
- `VITE_WS_URL` - WebSocket URL for real-time updates

## Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

### Docker (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]
```

## Contributing

1. Follow the existing code style and TypeScript conventions
2. Use meaningful component and variable names
3. Add proper error handling and loading states
4. Test on different screen sizes
5. Update types when modifying API interfaces

## Troubleshooting

### Common Issues

1. **Backend Connection Failed**
   - Ensure backend is running on http://localhost:8000
   - Check CORS settings in backend configuration

2. **Build Errors**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check TypeScript errors: `npm run build`

3. **Styling Issues**
   - Ensure Tailwind CSS is properly configured
   - Check for conflicting CSS classes

### Performance Tips

- Use React Query's caching effectively
- Implement proper loading states
- Optimize bundle size with code splitting
- Use React.memo for expensive components

## License

This project is part of the Multi-Agent Code Generator system.
