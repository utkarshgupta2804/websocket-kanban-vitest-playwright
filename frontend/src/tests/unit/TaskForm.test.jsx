import { render, screen, fireEvent } from "@testing-library/react"
import TaskForm from "../../components/TaskForm"

test("renders task form with all inputs", () => {
  const onCreateTask = jest.fn()
  render(<TaskForm onCreateTask={onCreateTask} />)

  expect(screen.getByTestId("task-title-input")).toBeInTheDocument()
  expect(screen.getByTestId("task-description-input")).toBeInTheDocument()
  expect(screen.getByTestId("task-priority-select")).toBeInTheDocument()
  expect(screen.getByTestId("task-category-select")).toBeInTheDocument()
  expect(screen.getByTestId("task-file-input")).toBeInTheDocument()
  expect(screen.getByTestId("create-task-button")).toBeInTheDocument()
})

test("calls onCreateTask with form data when submitted", () => {
  const onCreateTask = jest.fn()
  render(<TaskForm onCreateTask={onCreateTask} />)

  // Fill out the form
  fireEvent.change(screen.getByTestId("task-title-input"), {
    target: { value: "New Task" },
  })

  fireEvent.change(screen.getByTestId("task-description-input"), {
    target: { value: "Task description" },
  })

  fireEvent.change(screen.getByTestId("task-priority-select"), {
    target: { value: "High" },
  })

  fireEvent.change(screen.getByTestId("task-category-select"), {
    target: { value: "Bug" },
  })

  // Submit the form
  fireEvent.submit(screen.getByTestId("task-form"))

  // Check if onCreateTask was called with the correct data
  expect(onCreateTask).toHaveBeenCalledTimes(1)
  expect(onCreateTask.mock.calls[0][0]).toMatchObject({
    title: "New Task",
    description: "Task description",
    priority: "High",
    category: "Bug",
    status: "To Do",
  })
})

test("resets form after submission", () => {
  const onCreateTask = jest.fn()
  render(<TaskForm onCreateTask={onCreateTask} />)

  // Fill out the form
  fireEvent.change(screen.getByTestId("task-title-input"), {
    target: { value: "New Task" },
  })

  // Submit the form
  fireEvent.submit(screen.getByTestId("task-form"))

  // Check if form was reset
  expect(screen.getByTestId("task-title-input").value).toBe("")
})
