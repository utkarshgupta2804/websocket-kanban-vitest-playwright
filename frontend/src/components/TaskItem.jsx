"use client"
import { useDrag } from "react-dnd"

const TaskItem = ({ task, columnName, onDelete, onEdit }) => {
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
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-gray-900">{task.title}</h3>
        <div className="flex space-x-1">
          <button onClick={() => onEdit(task)} className="text-gray-500 hover:text-blue-500" aria-label="Edit task">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(task.id, columnName)}
            className="text-gray-500 hover:text-red-500"
            aria-label="Delete task"
          >
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

export default TaskItem
