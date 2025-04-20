const { createServer } = require('http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');
const { v4: uuidv4 } = require('uuid');

describe('WebSocket Server', () => {
  let io, serverSocket, clientSocket, httpServer;

  beforeAll((done) => {
    // Create HTTP server
    httpServer = createServer();
    // Create Socket.IO server
    io = new Server(httpServer);
    // Start HTTP server on a random port
    httpServer.listen(() => {
      const port = httpServer.address().port;
      
      // Setup server event handlers
      io.on('connection', (socket) => {
        serverSocket = socket;
        
        // Mock in-memory data storage
        const columns = {
          'To Do': [],
          'In Progress': [],
          'Done': []
        };
        
        // Send initial board state
        socket.emit('board:init', columns);
        
        // Handle task creation
        socket.on('task:create', (taskData) => {
          const task = {
            ...taskData,
            id: taskData.id || uuidv4(),
            createdAt: new Date().toISOString()
          };
          
          const column = taskData.status || 'To Do';
          columns[column].push(task);
          
          io.emit('task:created', { task, column });
          io.emit('board:update', columns);
        });
        
        // Handle task deletion
        socket.on('task:delete', ({ taskId, column }) => {
          const columnTasks = columns[column];
          const taskIndex = columnTasks.findIndex(task => task.id === taskId);
          
          if (taskIndex !== -1) {
            columnTasks.splice(taskIndex, 1);
            io.emit('task:deleted', { taskId, column });
            io.emit('board:update', columns);
          }
        });
        
        // Handle task movement
        socket.on('task:move', ({ taskId, fromColumn, toColumn }) => {
          const sourceColumnTasks = columns[fromColumn];
          const taskIndex = sourceColumnTasks.findIndex(task => task.id === taskId);
          
          if (taskIndex !== -1) {
            const [task] = sourceColumnTasks.splice(taskIndex, 1);
            columns[toColumn].push(task);
            
            io.emit('task:moved', { taskId, fromColumn, toColumn });
            io.emit('board:update', columns);
          }
        });
      });
      
      // Setup client
      clientSocket = Client(`http://localhost:${port}`);
      clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    io.close();
    clientSocket.close();
    httpServer.close();
  });

  test('should receive initial board state', (done) => {
    clientSocket.on('board:init', (columns) => {
      expect(columns).toEqual({
        'To Do': [],
        'In Progress': [],
        'Done': []
      });
      done();
    });
  });

  test('should create a task', (done) => {
    const mockTask = {
      title: 'Test Task',
      description: 'This is a test task',
      priority: 'Medium',
      category: 'Feature',
      status: 'To Do'
    };

    clientSocket.emit('task:create', mockTask);

    clientSocket.on('task:created', ({ task, column }) => {
      expect(column).toBe('To Do');
      expect(task.title).toBe(mockTask.title);
      expect(task.description).toBe(mockTask.description);
      expect(task.id).toBeDefined();
      
      // Use the created task for next test
      const createdTaskId = task.id;
      
      // Test task deletion
      clientSocket.emit('task:delete', { taskId: createdTaskId, column: 'To Do' });
      
      clientSocket.on('task:deleted', (data) => {
        expect(data.taskId).toBe(createdTaskId);
        expect(data.column).toBe('To Do');
        done();
      });
    });
  });

  test('should move task between columns', (done) => {
    // Create a task first
    const mockTask = {
      id: uuidv4(),
      title: 'Task to Move',
      description: 'This task will be moved',
      priority: 'High',
      category: 'Bug',
      status: 'To Do'
    };

    clientSocket.emit('task:create', mockTask);

    clientSocket.on('task:created', ({ task }) => {
      // Now move the task
      clientSocket.emit('task:move', {
        taskId: task.id,
        fromColumn: 'To Do',
        toColumn: 'In Progress'
      });

      clientSocket.on('task:moved', (data) => {
        expect(data.taskId).toBe(task.id);
        expect(data.fromColumn).toBe('To Do');
        expect(data.toColumn).toBe('In Progress');
        done();
      });
    });
  });
});