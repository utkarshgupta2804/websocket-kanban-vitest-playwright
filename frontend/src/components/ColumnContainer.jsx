import { useDrop } from "react-dnd"
import TaskItem from "./TaskItem"

const ColumnContainer = ({ name, tasks, onDeleteTask, onEditTask, socket }) => {
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
      data-testid={`column-${name.toLowerCase().replace(" ", "-")}`}
    >
      <div className={`rounded-md px-3 py-2 mb-4 font-medium ${getColumnHeaderColor(name)}`}>
        <h2 className="text-lg">
          {name} ({tasks.length})
        </h2>
      </div>

      <div>
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} columnName={name} onDelete={onDeleteTask} onEdit={onEditTask} />
        ))}
      </div>
    </div>
  )
}

export default ColumnContainer
