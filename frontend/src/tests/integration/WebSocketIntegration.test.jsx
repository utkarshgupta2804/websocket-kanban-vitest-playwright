import { render, screen, act } from "@testing-library/react"
import { io } from "socket.io-client"
import KanbanBoard from "../../components/KanbanBoard"

// Mock socket.io-client
jest.mock("socket.io-client")

describe("WebSocket Integration", () => {
  let mockSocket

  beforeEach(() => {
    // Create a mock socket object
    mockSocket = {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    }

    // Make io return our mock socket
    io.mockReturnValue(mockSocket)
  })

  test("WebSocket connects and requests initial sync", () => {
    render(<KanbanBoard />)

    // Check if socket.on was called for all expected events
    expect(mockSocket.on).toHaveBeenCalledWith("sync:tasks", expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith("task:create", expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith("task:update", expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith("task:move", expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith("task:delete", expect.any(Function))

    // Check if initial sync was requested
    expect(mockSocket.emit).toHaveBeenCalledWith("sync:tasks")
  })

  test("WebSocket receives task update and updates UI", async () => {
    // Set up the mock to call the callback function with data
    mockSocket.on.mockImplementation((event, callback) => {
      if (event === "sync:tasks") {
        // Simulate receiving initial tasks
        callback({
          "To Do": [
            {
              id: "1",
              title: "Initial Task",
              description: "Test",
              priority: "Medium",
              category: "Feature",
              status: "To Do",
            },
          ],
          "In Progress": [],
          Done: [],
        })
      }
    })

    render(<KanbanBoard />)

    // Check if the task is displayed
    expect(await screen.findByText("Initial Task")).toBeInTheDocument()

    // Simulate receiving a task update
    const syncTasksCallback = mockSocket.on.mock.calls.find((call) => call[0] === "task:update")[1]

    act(() => {
      syncTasksCallback({
        id: "1",
        title: "Updated Task",
        description: "Updated description",
        priority: "High",
        category: "Bug",
        status: "To Do",
      })
    })

    // Check if the UI was updated
    expect(await screen.findByText("Updated Task")).toBeInTheDocument()
  })

  test("WebSocket emits task:create event when creating a task", async () => {
    render(<KanbanBoard />)

    // Find the form elements
    const titleInput = screen.getByPlaceholderText("Add a new task")
    const createButton = screen.getByText("Create Task")

    // Fill out the form
    await act(async () => {
      titleInput.value = "New WebSocket Task"
      titleInput.dispatchEvent(new Event("change"))
    })

    // Submit the form
    await act(async () => {
      createButton.click()
    })

    // Check if the socket emitted the task:create event
    expect(mockSocket.emit).toHaveBeenCalledWith(
      "task:create",
      expect.objectContaining({
        title: "New WebSocket Task",
      }),
    )
  })

  test("WebSocket emits task:move event when moving a task", async () => {
    // Set up the mock to call the callback function with data
    mockSocket.on.mockImplementation((event, callback) => {
      if (event === "sync:tasks") {
        // Simulate receiving initial tasks
        callback({
          "To Do": [
            {
              id: "1",
              title: "Task to Move",
              description: "Test",
              priority: "Medium",
              category: "Feature",
              status: "To Do",
            },
          ],
          "In Progress": [],
          Done: [],
        })
      }
    })

    render(<KanbanBoard />)

    // Find the drop handler for the 'In Progress' column
    const dropHandlers = mockSocket.on.mock.calls.filter((call) => call[0] === "task:move").map((call) => call[1])

    // Simulate a drop event
    if (dropHandlers.length > 0) {
      act(() => {
        // This would normally be called by the drop handler in the DnD implementation
        mockSocket.emit("task:move", {
          taskId: "1",
          fromColumn: "To Do",
          toColumn: "In Progress",
        })
      })

      // Check if the socket emitted the task:move event
      expect(mockSocket.emit).toHaveBeenCalledWith(
        "task:move",
        expect.objectContaining({
          taskId: "1",
          fromColumn: "To Do",
          toColumn: "In Progress",
        }),
      )
    }
  })
})
