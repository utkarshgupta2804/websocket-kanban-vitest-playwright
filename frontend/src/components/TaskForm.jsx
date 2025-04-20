"use client"

import { useState, useRef } from "react"
import { v4 as uuidv4 } from "uuid"

const TaskForm = ({ onCreateTask }) => {
  const [task, setTask] = useState({
    title: "",
    description: "",
    priority: "Medium",
    category: "Feature",
    attachments: [],
  })

  const [filePreview, setFilePreview] = useState(null)
  const fileInputRef = useRef(null)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setTask((prev) => ({ ...prev, [name]: value }))
  }

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
    setTask((prev) => ({
      ...prev,
      attachments: [
        ...prev.attachments,
        {
          name: file.name,
          type: file.type,
          url: URL.createObjectURL(file),
        },
      ],
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const newTask = {
      id: uuidv4(),
      ...task,
      status: "To Do",
      createdAt: new Date().toISOString(),
    }

    onCreateTask(newTask)

    // Reset form
    setTask({
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

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4">Create New Task</h2>
      <form onSubmit={handleSubmit} className="space-y-4" data-testid="task-form">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            name="title"
            value={task.title}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            data-testid="task-title-input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            value={task.description}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            data-testid="task-description-input"
          ></textarea>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              name="priority"
              value={task.priority}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="task-priority-select"
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
              value={task.category}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="task-category-select"
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
            data-testid="task-file-input"
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
          data-testid="create-task-button"
        >
          Create Task
        </button>
      </form>
    </div>
  )
}

export default TaskForm
