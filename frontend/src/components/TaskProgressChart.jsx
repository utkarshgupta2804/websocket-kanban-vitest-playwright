import { Bar } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js"

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const TaskProgressChart = ({ columns }) => {
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
    <div className="bg-white rounded-lg shadow-md p-6 mb-8" data-testid="task-progress-chart">
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
                data-testid="completion-percentage"
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
  )
}

export default TaskProgressChart
