"use client"

import { useState, useEffect, useRef } from "react"
import { DndProvider, useDrag, useDrop } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { io } from "socket.io-client"
import { Bar } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js"
import { v4 as uuidv4 } from "uuid"

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

// Socket.io connection
const socket = io("http://localhost:5000")

const KanbanBoard = () => {
  // State for tasks in each column
  const [columns, setColumns] = useState({
    "To Do": [],
    "In Progress": [],
    Done: [],
  })

  // State for new task form
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "Medium",
    category: "Feature",
    attachments: [],
  })

  // State for task being edited
  const [editingTask, setEditingTask] = useState(null)

  // State for loading indicator
  const [isLoading, setIsLoading] = useState(true)

  // State for file upload preview
  const [filePreview, setFilePreview] = useState(null)

  // Ref for file input
  const fileInputRef = useRef(null)

  // Connect to WebSocket and listen for events
  useEffect(() => {
    // Set loading state
    setIsLoading(true)

    // Listen for initial sync of tasks
    socket.on("sync:tasks", (tasks) => {
      setColumns(tasks)
      setIsLoading(false)
    })

    // Listen for task creation
    socket.on("task:create", (task) => {
      setColumns((prevColumns) => {
        const column = task.status || "To Do"
        return {
          ...prevColumns,
          [column]: [...prevColumns[column], task],
        }
      })
    })

    // Listen for task updates
    socket.on("task:update", (updatedTask) => {
      setColumns((prevColumns) => {
        const column = updatedTask.status
        return {
          ...prevColumns,
          [column]: prevColumns[column].map((task) => (task.id === updatedTask.id ? updatedTask : task)),
        }
      })
    })

    // Listen for task moves
    socket.on("task:move", ({ taskId, fromColumn, toColumn }) => {
      setColumns((prevColumns) => {
        // Find the task in the fromColumn
        const taskToMove = prevColumns[fromColumn].find((task) => task.id === taskId)

        if (!taskToMove) return prevColumns

        // Update the task's status
        const updatedTask = { ...taskToMove, status: toColumn }

        // Remove from old column and add to new column
        return {
          ...prevColumns,
          [fromColumn]: prevColumns[fromColumn].filter((task) => task.id !== taskId),
          [toColumn]: [...prevColumns[toColumn], updatedTask],
        }
      })
    })

    // Listen for task deletion
    socket.on("task:delete", ({ taskId, column }) => {
      setColumns((prevColumns) => {
        return {
          ...prevColumns,
          [column]: prevColumns[column].filter((task) => task.id !== taskId),
        }
      })
    })

    // Request initial sync of tasks
    socket.emit("sync:tasks")

    // Cleanup on unmount
    return () => {
      socket.off("sync:tasks")
      socket.off("task:create")
      socket.off("task:update")
      socket.off("task:move")
      socket.off("task:delete")
    }
  }, [])

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewTask((prev) => ({ ...prev, [name]: value }))
  }

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Create a preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setFilePreview(e.target.result)
      }
      reader.readAsDataURL(file)
    } else {
      setFilePreview(file.name)
    }

    // Add to attachments
    setNewTask((prev) => ({
      ...prev,
      attachments: [
        ...prev.attachments,
        {
          name: file.name,
          type: file.type,
          url: URL.createObjectURL(file), // This is temporary and would be replaced by a server URL in production
        },
      ],
    }))
  }

  // Handle task creation
  const handleCreateTask = (e) => {
    e.preventDefault()

    const task = {
      id: uuidv4(),
      ...newTask,
      status: "To Do",
      createdAt: new Date().toISOString(),
    }

    // Emit task creation event
    socket.emit("task:create", task)

    // Reset form
    setNewTask({
      title: "",
      description: "",
      priority: "Medium",
      category: "Feature",
      attachments: [],
    })
    setFilePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Handle task update
  const handleUpdateTask = (e) => {
    e.preventDefault()

    // Emit task update event
    socket.emit("task:update", editingTask)

    // Reset editing state
    setEditingTask(null)
  }

  // Handle task deletion
  const handleDeleteTask = (taskId, column) => {
    // Emit task deletion event
    socket.emit("task:delete", { taskId, column })
  }

  // Start editing a task
  const startEditingTask = (task) => {
    setEditingTask(task)
  }

  // Handle editing task input changes
  const handleEditingInputChange = (e) => {
    const { name, value } = e.target
    setEditingTask((prev) => ({ ...prev, [name]: value }))
  }

  // Cancel editing
  const cancelEditing = () => {
    setEditingTask(null)
  }

  // Prepare data for chart
  const chartData = {
    labels: Object.keys(columns),
    datasets: [
      {
        label: "Number of Tasks",
        data: Object.values(columns).map((tasks) => tasks.length),
        backgroundColor: ["rgba(255, 99, 132, 0.6)", "rgba(54, 162, 235, 0.6)", "rgba(75, 192, 192, 0.6)"],
        borderColor: ["rgba(255, 99, 132, 1)", "rgba(54, 162, 235, 1)", "rgba(75, 192, 192, 1)"],
        borderWidth: 1,
      },
    ],
  }

  // Chart options
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Task Progress",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  }

  // Calculate completion percentage
  const totalTasks = Object.values(columns).flat().length
  const completedTasks = columns["Done"]?.length || 0
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Real-time Kanban Board</h1>

      

      {/* Task creation form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Create New Task</h2>
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              name="title"
              value={newTask.title}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={newTask.description}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                name="priority"
                value={newTask.priority}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                name="category"
                value={newTask.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Bug">Bug</option>
                <option value="Feature">Feature</option>
                <option value="Enhancement">Enhancement</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Attachments</label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {filePreview && (
              <div className="mt-2">
                <p className="text-sm text-gray-500 mb-1">Preview:</p>
                {typeof filePreview === "string" && filePreview.startsWith("data:image") ? (
                  <img
                    src={filePreview || "/placeholder.svg"}
                    alt="Preview"
                    className="h-24 object-contain rounded border border-gray-300"
                  />
                ) : (
                  <div className="p-2 bg-gray-100 rounded border border-gray-300">
                    <p className="text-sm">{typeof filePreview === "string" ? filePreview : "File attached"}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition duration-200"
          >
            Create Task
          </button>
        </form>
      </div>

      {/* Task progress visualization */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Task Progress</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <Bar data={chartData} options={chartOptions} />
          </div>

          <div className="flex flex-col justify-center">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Completion Rate</h3>
              <div className="w-full bg-gray-200 rounded-full h-6 mb-2">
                <div
                  className="bg-green-500 h-6 rounded-full text-white text-center leading-6"
                  style={{ width: `${completionPercentage}%` }}
                >
                  {completionPercentage}%
                </div>
              </div>
              <p className="text-gray-600">
                {completedTasks} of {totalTasks} tasks completed
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Task editing modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Edit Task</h2>
            <form onSubmit={handleUpdateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  name="title"
                  value={editingTask.title}
                  onChange={handleEditingInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={editingTask.description}
                  onChange={handleEditingInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    name="priority"
                    value={editingTask.priority}
                    onChange={handleEditingInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    name="category"
                    value={editingTask.category}
                    onChange={handleEditingInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Bug">Bug</option>
                    <option value="Feature">Feature</option>
                    <option value="Enhancement">Enhancement</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-md transition duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition duration-200"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kanban board */}
      <DndProvider backend={HTML5Backend}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.keys(columns).map((columnName) => (
            <Column
              key={columnName}
              name={columnName}
              tasks={columns[columnName]}
              onDeleteTask={handleDeleteTask}
              onEditTask={startEditingTask}
              socket={socket}
            />
          ))}
        </div>
      </DndProvider>
    </div>
  )
}

// Task component
const Task = ({ task, columnName, onDelete, onEdit }) => {
  // Set up drag functionality
  const [{ isDragging }, drag] = useDrag({
    type: "TASK",
    item: { id: task.id, fromColumn: columnName },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  })

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "bg-red-100 border-red-300 text-red-800"
      case "Medium":
        return "bg-yellow-100 border-yellow-300 text-yellow-800"
      case "Low":
        return "bg-green-100 border-green-300 text-green-800"
      default:
        return "bg-gray-100 border-gray-300 text-gray-800"
    }
  }

  // Get category color
  const getCategoryColor = (category) => {
    switch (category) {
      case "Bug":
        return "bg-red-500"
      case "Feature":
        return "bg-blue-500"
      case "Enhancement":
        return "bg-purple-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div
      ref={drag}
      className={`bg-white rounded-lg shadow p-4 mb-3 cursor-move ${isDragging ? "opacity-50" : "opacity-100"}`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-gray-900">{task.title}</h3>
        <div className="flex space-x-1">
          <button onClick={() => onEdit(task)} className="text-gray-500 hover:text-blue-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
          <button onClick={() => onDelete(task.id, columnName)} className="text-gray-500 hover:text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      {task.description && <p className="text-sm text-gray-600 mb-3">{task.description}</p>}

      <div className="flex flex-wrap gap-2 mb-3">
        <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>{task.priority}</span>
        <span className={`text-xs px-2 py-1 rounded-full text-white ${getCategoryColor(task.category)}`}>
          {task.category}
        </span>
      </div>

      {task.attachments && task.attachments.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-gray-500 mb-1">Attachments:</p>
          <div className="space-y-1">
            {task.attachments.map((attachment, index) => (
              <div key={index} className="flex items-center">
                {attachment.type.startsWith("image/") ? (
                  <img
                    src={attachment.url || "/placeholder.svg"}
                    alt={attachment.name}
                    className="h-12 w-12 object-cover rounded border border-gray-200"
                  />
                ) : (
                  <div className="flex items-center text-xs text-gray-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                      />
                    </svg>
                    {attachment.name}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Column component
const Column = ({ name, tasks, onDeleteTask, onEditTask, socket }) => {
  // Set up drop functionality
  const [{ isOver }, drop] = useDrop({
    accept: "TASK",
    drop: (item) => {
      if (item.fromColumn !== name) {
        // Emit task move event
        socket.emit("task:move", {
          taskId: item.id,
          fromColumn: item.fromColumn,
          toColumn: name,
        })
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  })

  // Get column header color
  const getColumnHeaderColor = (columnName) => {
    switch (columnName) {
      case "To Do":
        return "bg-gray-100 border-gray-300"
      case "In Progress":
        return "bg-blue-100 border-blue-300"
      case "Done":
        return "bg-green-100 border-green-300"
      default:
        return "bg-gray-100 border-gray-300"
    }
  }

  return (
    <div
      ref={drop}
      className={`bg-gray-50 rounded-lg border-2 ${isOver ? "border-blue-400 bg-blue-50" : "border-gray-200"} p-4 h-full min-h-[500px]`}
    >
      <div className={`rounded-md px-3 py-2 mb-4 font-medium ${getColumnHeaderColor(name)}`}>
        <h2 className="text-lg">
          {name} ({tasks.length})
        </h2>
      </div>

      <div>
        {tasks.map((task) => (
          <Task key={task.id} task={task} columnName={name} onDelete={onDeleteTask} onEdit={onEditTask} />
        ))}
      </div>
    </div>
  )
}

export default KanbanBoard
