import { render, screen, fireEvent } from "@testing-library/react"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import TaskItem from "../../components/TaskItem"

// Mock task data
const mockTask = {
  id: "1",
  title: "Test Task",
  description: "This is a test task",
  priority: "Medium",
  category: "Feature",
  attachments: [],
}

// Wrap component with DndProvider for testing
const renderWithDnd = (ui) => {
  return render(<DndProvider backend={HTML5Backend}>{ui}</DndProvider>)
}

test("renders task with correct title and description", () => {
  const onDelete = jest.fn()
  const onEdit = jest.fn()

  renderWithDnd(<TaskItem task={mockTask} columnName="To Do" onDelete={onDelete} onEdit={onEdit} />)

  expect(screen.getByText("Test Task")).toBeInTheDocument()
  expect(screen.getByText("This is a test task")).toBeInTheDocument()
})

test("calls onEdit when edit button is clicked", () => {
  const onDelete = jest.fn()
  const onEdit = jest.fn()

  renderWithDnd(<TaskItem task={mockTask} columnName="To Do" onDelete={onDelete} onEdit={onEdit} />)

  fireEvent.click(screen.getByLabelText("Edit task"))
  expect(onEdit).toHaveBeenCalledWith(mockTask)
})

test("calls onDelete when delete button is clicked", () => {
  const onDelete = jest.fn()
  const onEdit = jest.fn()

  renderWithDnd(<TaskItem task={mockTask} columnName="To Do" onDelete={onDelete} onEdit={onEdit} />)

  fireEvent.click(screen.getByLabelText("Delete task"))
  expect(onDelete).toHaveBeenCalledWith("1", "To Do")
})

test("displays priority and category badges", () => {
  const onDelete = jest.fn()
  const onEdit = jest.fn()

  renderWithDnd(<TaskItem task={mockTask} columnName="To Do" onDelete={onDelete} onEdit={onEdit} />)

  expect(screen.getByText("Medium")).toBeInTheDocument()
  expect(screen.getByText("Feature")).toBeInTheDocument()
})
