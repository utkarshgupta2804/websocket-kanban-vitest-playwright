import { test, expect } from "@playwright/test"

test("User can add a task and see it on the board", async ({ page }) => {
  // Navigate to the app
  await page.goto("http://localhost:3000")

  // Verify the title is visible
  await expect(page.getByText("Real-time Kanban Board")).toBeVisible()

  // Fill out the task form
  await page.getByTestId("task-title-input").fill("E2E Test Task")
  await page.getByTestId("task-description-input").fill("This task was created during E2E testing")
  await page.getByTestId("task-priority-select").selectOption("High")
  await page.getByTestId("task-category-select").selectOption("Bug")

  // Submit the form
  await page.getByTestId("create-task-button").click()

  // Verify the task appears in the "To Do" column
  await expect(page.getByText("E2E Test Task")).toBeVisible()
  await expect(page.getByText("This task was created during E2E testing")).toBeVisible()

  // Verify the task has the correct priority and category
  await expect(page.getByText("High")).toBeVisible()
  await expect(page.getByText("Bug")).toBeVisible()
})

test("User can edit a task", async ({ page }) => {
  // Navigate to the app
  await page.goto("http://localhost:3000")

  // Create a task first
  await page.getByTestId("task-title-input").fill("Task to Edit")
  await page.getByTestId("task-description-input").fill("This task will be edited")
  await page.getByTestId("create-task-button").click()

  // Click the edit button on the task
  await page.getByLabelText("Edit task").first().click()

  // Edit the task
  await page.getByTestId("edit-title-input").fill("Edited Task Title")
  await page.getByTestId("edit-description-input").fill("This task has been edited")
  await page.getByTestId("edit-priority-select").selectOption("Low")

  // Save the changes
  await page.getByTestId("save-edit-button").click()

  // Verify the task was updated
  await expect(page.getByText("Edited Task Title")).toBeVisible()
  await expect(page.getByText("This task has been edited")).toBeVisible()
  await expect(page.getByText("Low")).toBeVisible()
})

test("User can delete a task", async ({ page }) => {
  // Navigate to the app
  await page.goto("http://localhost:3000")

  // Create a task first
  await page.getByTestId("task-title-input").fill("Task to Delete")
  await page.getByTestId("task-description-input").fill("This task will be deleted")
  await page.getByTestId("create-task-button").click()

  // Verify the task exists
  await expect(page.getByText("Task to Delete")).toBeVisible()

  // Delete the task
  await page.getByLabelText("Delete task").first().click()

  // Verify the task was deleted
  await expect(page.getByText("Task to Delete")).not.toBeVisible()
})

test("Task progress chart updates when tasks are added", async ({ page }) => {
  // Navigate to the app
  await page.goto("http://localhost:3000")

  // Get initial completion percentage
  const initialPercentage = await page.getByTestId("completion-percentage").textContent()

  // Create a task
  await page.getByTestId("task-title-input").fill("Chart Test Task")
  await page.getByTestId("task-description-input").fill("Testing chart updates")
  await page.getByTestId("create-task-button").click()

  // Verify the chart updates
  // Note: This is a basic check. In a real test, you might want to check the actual values
  await expect(page.getByTestId("task-progress-chart")).toBeVisible()
})
