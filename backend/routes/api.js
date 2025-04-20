const express = require('express');
const router = express.Router();
const upload = require('../middleware/fileUpload');
const path = require('path');
const fs = require('fs');

// Reference to in-memory data store (initialized in server.js)
let columnsRef;

// Initialize reference to columns data
const initializeColumnsRef = (columns) => {
  columnsRef = columns;
};

// GET: Get the current board state
router.get('/board', (req, res) => {
  res.json({ columns: columnsRef });
});

// POST: Create a task via REST API (alternative to WebSocket)
router.post('/tasks', (req, res) => {
  try {
    const taskData = req.body;
    
    if (!taskData.title) {
      return res.status(400).json({ error: 'Task title is required' });
    }
    
    // Add task to columns
    const column = taskData.status || 'To Do';
    
    if (!columnsRef[column]) {
      return res.status(400).json({ error: 'Invalid column' });
    }
    
    // Generate task with ID and timestamp
    const task = {
      ...taskData,
      id: taskData.id || require('uuid').v4(),
      createdAt: new Date().toISOString()
    };
    
    columnsRef[column].push(task);
    
    // Note: WebSocket broadcast would happen in server.js
    
    res.status(201).json({ task, column });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// DELETE: Delete a task via REST API
router.delete('/tasks/:id', (req, res) => {
  try {
    const taskId = req.params.id;
    const { column } = req.query;
    
    if (!column || !columnsRef[column]) {
      return res.status(400).json({ error: 'Valid column must be specified' });
    }
    
    const columnTasks = columnsRef[column];
    const taskIndex = columnTasks.findIndex(task => task.id === taskId);
    
    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Remove task
    columnTasks.splice(taskIndex, 1);
    
    // Note: WebSocket broadcast would happen in server.js
    
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// PATCH: Update a task via REST API
router.patch('/tasks/:id', (req, res) => {
  try {
    const taskId = req.params.id;
    const updates = req.body;
    let updatedTask = null;
    let taskColumn = null;
    
    // Find task in all columns
    for (const [columnName, tasks] of Object.entries(columnsRef)) {
      const taskIndex = tasks.findIndex(task => task.id === taskId);
      
      if (taskIndex !== -1) {
        // Update the task
        updatedTask = {
          ...tasks[taskIndex],
          ...updates,
          updatedAt: new Date().toISOString()
        };
        
        tasks[taskIndex] = updatedTask;
        taskColumn = columnName;
        break;
      }
    }
    
    if (!updatedTask) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Note: WebSocket broadcast would happen in server.js
    
    res.status(200).json({ task: updatedTask, column: taskColumn });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// POST: Upload file attachment for a task
router.post('/tasks/:id/attachments', upload.single('file'), (req, res) => {
  try {
    const taskId = req.params.id;
    const { column } = req.query;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    if (!column || !columnsRef[column]) {
      return res.status(400).json({ error: 'Valid column must be specified' });
    }
    
    const columnTasks = columnsRef[column];
    const taskIndex = columnTasks.findIndex(task => task.id === taskId);
    
    if (taskIndex === -1) {
      // Clean up the uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Create file attachment object
    const attachment = {
      id: require('uuid').v4(),
      name: req.file.originalname,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: `/uploads/${req.file.filename}` // URL path for client
    };
    
    // Add attachment to task
    if (!columnTasks[taskIndex].attachments) {
      columnTasks[taskIndex].attachments = [];
    }
    
    columnTasks[taskIndex].attachments.push(attachment);
    
    // Note: WebSocket broadcast would happen in server.js
    
    res.status(201).json({ attachment });
  } catch (error) {
    console.error('Error uploading attachment:', error);
    res.status(500).json({ error: 'Failed to upload attachment' });
  }
});

// GET: Serve uploaded files
router.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads', filename);
  
  // Check if file exists
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

module.exports = { 
  router,
  initializeColumnsRef
};