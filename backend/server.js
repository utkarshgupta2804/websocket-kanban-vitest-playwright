const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { router: apiRouter, initializeColumnsRef } = require('./routes/api');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Configure CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://your-production-domain.com' 
    : 'http://localhost:3000'
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? 'https://your-production-domain.com' 
      : 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// In-memory data storage
const columns = {
  'To Do': [],
  'In Progress': [],
  'Done': []
};

// Initialize API routes with reference to columns
initializeColumnsRef(columns);
app.use('/api', apiRouter);

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('A User connected');
  
  // Send initial board state to the newly connected client
  socket.emit('board:init', columns);
  
  // Handle task creation
  socket.on('task:create', (taskData) => {
    // Generate unique ID if not provided
    const task = {
      ...taskData,
      id: taskData.id || uuidv4(),
      createdAt: new Date().toISOString()
    };
    
    // Add task to the appropriate column (default to 'To Do')
    const column = taskData.status || 'To Do';
    columns[column].push(task);
    
    // Broadcast the new task to all clients
    io.emit('task:created', { task, column });
    
    // Update board state for all clients
    io.emit('board:update', columns);
  });
  
  // Handle task deletion
  socket.on('task:delete', ({ taskId, column }) => {
    // Find and remove the task
    const columnTasks = columns[column];
    const taskIndex = columnTasks.findIndex(task => task.id === taskId);
    
    if (taskIndex !== -1) {
      columnTasks.splice(taskIndex, 1);
      
      // Broadcast task deletion to all clients
      io.emit('task:deleted', { taskId, column });
      
      // Update board state for all clients
      io.emit('board:update', columns);
    }
  });
  
  // Handle task movement between columns
  socket.on('task:move', ({ taskId, fromColumn, toColumn }) => {
    // Find the task in the source column
    const sourceColumnTasks = columns[fromColumn];
    const taskIndex = sourceColumnTasks.findIndex(task => task.id === taskId);
    
    if (taskIndex !== -1) {
      // Remove task from source column
      const [task] = sourceColumnTasks.splice(taskIndex, 1);
      
      // Add task to target column
      columns[toColumn].push(task);
      
      // Broadcast task movement to all clients
      io.emit('task:moved', { taskId, fromColumn, toColumn });
      
      // Update board state for all clients
      io.emit('board:update', columns);
    }
  });
  
  // Handle task editing
  socket.on('task:edit', (updatedTask) => {
    // Find the task in all columns
    for (const [columnName, tasks] of Object.entries(columns)) {
      const taskIndex = tasks.findIndex(task => task.id === updatedTask.id);
      
      if (taskIndex !== -1) {
        // Update the task
        columns[columnName][taskIndex] = {
          ...columns[columnName][taskIndex],
          ...updatedTask,
          updatedAt: new Date().toISOString()
        };
        
        // Broadcast task update to all clients
        io.emit('task:updated', { 
          task: columns[columnName][taskIndex], 
          column: columnName 
        });
        
        // Update board state for all clients
        io.emit('board:update', columns);
        break;
      }
    }
  });
  
  // Handle file uploads (can be enhanced with actual file storage)
  socket.on('task:upload', ({ taskId, column, file }) => {
    // Find the task
    const columnTasks = columns[column];
    const taskIndex = columnTasks.findIndex(task => task.id === taskId);
    
    if (taskIndex !== -1) {
      // Add file reference to task attachments
      if (!columnTasks[taskIndex].attachments) {
        columnTasks[taskIndex].attachments = [];
      }
      
      columnTasks[taskIndex].attachments.push({
        id: uuidv4(),
        name: file.name,
        type: file.type,
        size: file.size,
        url: `/uploads/${file.name}` // Placeholder URL
      });
      
      // Broadcast task update to all clients
      io.emit('task:updated', { 
        task: columnTasks[taskIndex], 
        column 
      });
      
      // Update board state for all clients
      io.emit('board:update', columns);
    }
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Optional: Route to serve React frontend in production
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server is ready for connections`);
});

module.exports = { app, server, io }; // Export for testing