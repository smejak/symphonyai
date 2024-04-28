# Symphony

Symphony is an advanced LLM (Large Language Model) agent dashboard and orchestration tool designed to facilitate seamless monitoring and management of agent tasks. It provides a comprehensive platform for tracking agent status in real-time while they complete assigned tasks, and offers dynamic human feedback capabilities to enhance agent performance and ensure optimal results.

## Key Features

- **Real-time Agent Monitoring**: Symphony enables users to monitor the status of multiple agents simultaneously, providing instant visibility into their progress, elapsed time, and current actions.

- **Dynamic Human Feedback**: The tool incorporates a powerful human feedback mechanism that allows users to provide real-time guidance and input to agents during task execution. This dynamic feedback loop ensures that agents stay on track and deliver accurate and relevant results.

- **Flexible Task Orchestration**: Symphony offers a flexible and intuitive interface for orchestrating agent tasks. Users can easily define and assign tasks to individual agents or groups of agents, set task priorities, and manage task dependencies.

- **Detailed Agent Insights**: The dashboard provides comprehensive insights into agent performance, including detailed metrics such as task completion rates, average response times, and error rates. These insights enable users to identify areas for improvement and optimize agent efficiency.

- **Seamless Integration**: Symphony seamlessly integrates with existing LLM frameworks and tools, allowing users to leverage their preferred models and libraries while benefiting from the enhanced monitoring and orchestration capabilities provided by the tool.

- **Customizable Alerts and Notifications**: Users can set up custom alerts and notifications based on specific agent events or performance thresholds. This ensures that users stay informed about critical agent activities and can take timely actions when needed.

- **Collaborative Workspace**: Symphony offers a collaborative workspace where multiple users can work together on agent tasks, share insights, and provide feedback. This fosters a collaborative environment and enables teams to collectively optimize agent performance.

## LangGraph Agent Stream API

The LangGraph Agent Stream API is a FastAPI server that exposes endpoints to run and monitor LangGraph agent streams. It allows you to dynamically provide a prompt, execute the agent stream, and retrieve the results and status of the last executed task.

### Requirements

- Python 3.6 or above
- FastAPI
- Uvicorn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/symphony.git
cd symphony
```

2. Install the required dependencies:

```bash
pip install fastapi uvicorn
```

3. Make sure you have the necessary dependencies for LangGraph and LangChain installed as well.

### Usage

1. Start the FastAPI server:

```bash
python agent_tracker.py
```

2. The server will start running on `http://localhost:8000`.

### API Endpoints

#### POST `/run_agent_stream`

This endpoint allows you to start a new agent stream with a provided prompt.

Request Body:

```json
{
  "prompt": "Scrape the first sentence on this link https://github.com/langchain-ai/langgraph/tree/main and then search the web to find the lead developer."
}
```

Response:

```json
{
  "message": "Agent stream started"
}
```

#### GET `/agent_status`

This endpoint provides information about the current status of the agent stream.

Response (when no task is running):

```json
{
  "current_agent": "",
  "elapsed_time": 0.0,
  "task_active": false,
  "message": "No task is currently running. Please submit a POST request to /run_agent_stream to start a new task.",
  "current_agent_call_count": 0,
  "prior_agents": [],
  "data": null,
  "human_feedback_requested": false
}
```

Response (when a task is running):

```json
{
  "current_agent": "WebScraper",
  "elapsed_time": 5.67,
  "task_active": true,
  "message": "",
  "current_agent_call_count": 1,
  "prior_agents": [
    {
      "agent": "Search",
      "call_count": 1
    }
  ],
  "data": [
    {
      "data": {
        "id": "search",
        "label": "Search",
        "timeElapsed": 2.34,
        "number_calls": 1,
        "status": "success"
      }
    },
    {
      "data": {
        "id": "web_scraper",
        "label": "WebScraper",
        "timeElapsed": 5.67,
        "number_calls": 1,
        "status": "running"
      }
    }
  ],
  "human_feedback_requested": false
}
```

#### GET `/last_task_results`

This endpoint retrieves the agent messages from the last executed task.

Response:

```json
[
  {
    "agent": "WebScraper",
    "message": "<Document name=\"langgraph/main at 32oid92dslkjj2309sdlk2 · langchain-ai/langgraph\">\nA graph based programming system for LLMs\n</Document>"
  },
  {
    "agent": "Search",
    "message": "According to the GitHub repository, the lead developer of LangGraph appears to be Harrison Chase."
  }
]
```

#### POST `/resolve_feedback`

This endpoint allows you to provide human feedback to an agent that has requested it.

Request Body:

```json
{
  "agent": "Search",
  "feedback": "Yes"
}
```

Response:

```json
{
  "message": "Feedback resolved for Search"
}
```

### Monitoring

While the server is running, you can monitor the progress and elapsed times of the agent stream in the console output. It will display the intermediate results, total elapsed time, and execution times for each agent.

### Resetting Results

The agent messages from the last executed task are automatically reset every time a new task is started. This ensures that the `/last_task_results` endpoint always returns the results from the most recently executed task.

## Conclusion

Symphony provides a powerful and intuitive platform for monitoring and orchestrating LLM agents. With its real-time monitoring capabilities, dynamic human feedback, and flexible task orchestration, Symphony empowers users to optimize agent performance and achieve superior results. Whether you are working on complex natural language processing tasks or developing intelligent conversational agents, Symphony offers the tools and insights needed to streamline your workflow and enhance agent efficiency.
