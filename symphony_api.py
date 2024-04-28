import getpass
import os
import time
import json
import functools
import asyncio
from fastapi import FastAPI, Request
from pydantic import BaseModel
import dotenv
dotenv.load_dotenv()

from typing import Any, Callable, List, Optional, TypedDict, Union

from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain.output_parsers.openai_functions import JsonOutputFunctionsParser
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import Runnable
from langchain_core.tools import BaseTool
from langchain_openai import ChatOpenAI

from langgraph.graph import END, StateGraph

from typing import Annotated, List, Tuple, Union

import matplotlib.pyplot as plt
from langchain_community.document_loaders import WebBaseLoader
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_core.tools import tool
from langsmith import trace

import functools
import operator

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage
from langchain_openai.chat_models import ChatOpenAI
import functools


os.environ["LANGCHAIN_TRACING_V2"] = "false"
os.environ["LANGCHAIN_PROJECT"] = "Multi-agent Collaboration"

# tools
tavily_tool = TavilySearchResults(max_results=5)


@tool
def scrape_webpages(urls: List[str]) -> str:
    """Use requests and bs4 to scrape the provided web pages for detailed information."""
    loader = WebBaseLoader(urls)
    docs = loader.load()
    return "\n\n".join(
        [
            f'<Document name="{doc.metadata.get("title", "")}">\n{doc.page_content}\n</Document>'
            for doc in docs
        ]
    )

from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Dict, Optional

from langchain_experimental.utilities import PythonREPL
from typing_extensions import TypedDict

_TEMP_DIRECTORY = TemporaryDirectory()
WORKING_DIRECTORY = Path(_TEMP_DIRECTORY.name)


@tool
def create_outline(
    points: Annotated[List[str], "List of main points or sections."],
    file_name: Annotated[str, "File path to save the outline."],
) -> Annotated[str, "Path of the saved outline file."]:
    """Create and save an outline."""
    with (WORKING_DIRECTORY / file_name).open("w") as file:
        for i, point in enumerate(points):
            file.write(f"{i + 1}. {point}\n")
    return f"Outline saved to {file_name}"


@tool
def read_document(
    file_name: Annotated[str, "File path to save the document."],
    start: Annotated[Optional[int], "The start line. Default is 0"] = None,
    end: Annotated[Optional[int], "The end line. Default is None"] = None,
) -> str:
    """Read the specified document."""
    with (WORKING_DIRECTORY / file_name).open("r") as file:
        lines = file.readlines()
    if start is not None:
        start = 0
    return "\n".join(lines[start:end])


@tool
def write_document(
    content: Annotated[str, "Text content to be written into the document."],
    file_name: Annotated[str, "File path to save the document."],
) -> Annotated[str, "Path of the saved document file."]:
    """Create and save a text document."""
    with (WORKING_DIRECTORY / file_name).open("w") as file:
        file.write(content)
    return f"Document saved to {file_name}"


@tool
def edit_document(
    file_name: Annotated[str, "Path of the document to be edited."],
    inserts: Annotated[
        Dict[int, str],
        "Dictionary where key is the line number (1-indexed) and value is the text to be inserted at that line.",
    ],
) -> Annotated[str, "Path of the edited document file."]:
    """Edit a document by inserting text at specific line numbers."""

    with (WORKING_DIRECTORY / file_name).open("r") as file:
        lines = file.readlines()

    sorted_inserts = sorted(inserts.items())

    for line_number, text in sorted_inserts:
        if 1 <= line_number <= len(lines) + 1:
            lines.insert(line_number - 1, text + "\n")
        else:
            return f"Error: Line number {line_number} is out of range."

    with (WORKING_DIRECTORY / file_name).open("w") as file:
        file.writelines(lines)

    return f"Document edited and saved to {file_name}"


# Warning: This executes code locally, which can be unsafe when not sandboxed

repl = PythonREPL()


@tool
def python_repl(
    code: Annotated[str, "The python code to execute to generate your chart."]
):
    """Use this to execute python code. If you want to see the output of a value,
    you should print it out with `print(...)`. This is visible to the user."""
    try:
        result = repl.run(code)
    except BaseException as e:
        return f"Failed to execute. Error: {repr(e)}"
    return f"Succesfully executed:\n```python\n{code}\n```\nStdout: {result}"

# team orchestration functions
def create_agent(
    llm: ChatOpenAI,
    tools: list,
    system_prompt: str,
) -> str:
    """Create a function-calling agent and add it to the graph."""
    system_prompt += "\nWork autonomously according to your specialty, using the tools available to you."
    " Do not ask for clarification."
    " Your other team members (and other teams) will collaborate with you with their own specialties."
    " You are chosen for a reason! You are one of the following team members: {team_members}."
    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                system_prompt,
            ),
            MessagesPlaceholder(variable_name="messages"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ]
    )
    agent = create_openai_functions_agent(llm, tools, prompt)
    executor = AgentExecutor(agent=agent, tools=tools)
    return executor

app = FastAPI()


agent_times = {}  # Define agent_times as a global variable
agent_start_times = {}  # Store the start time of each agent's execution
agent_completed = {}  # Track the completion status of each agent
agent_call_counts = {}  # Store the number of times each agent has been invoked
agent_call_sequence = []  # Store the sequence of agent invocations
stop_event = asyncio.Event()  # Create an event to signal when to stop
task_active = False  # Flag to indicate if a task is currently active
last_task_messages = []  # Store the agent messages from the last executed task
human_feedback_needed = {}

class HumanFeedbackRequest(BaseModel):
    agent: str
    feedback: str

class AgentStatus(BaseModel):
    current_agent: str = ""
    elapsed_time: float = 0.0
    task_active: bool = False
    message: str = ""
    current_agent_call_count: int = 0
    prior_agents: List[dict] = []
    data: List[dict] = None
    human_feedback_requested: bool = False

class PromptRequest(BaseModel):
    prompt: str

class TaskResult(BaseModel):
    agent: str
    message: str

def human_approval(agent: str, msg: AIMessage) -> Runnable:
    tool_strs = "\n\n".join(
        json.dumps(tool_call, indent=2) for tool_call in msg.tool_calls
    )
    human_feedback_needed[agent] = {
        "message": f"Do you approve of the following tool invocations for {agent}?\n\n{tool_strs}\n\n",
        "tool_invocations": tool_strs
    }
    raise ValueError(f"Waiting for human feedback for {agent}")

def resolve_human_feedback(agent: str, feedback: str) -> None:
    if feedback.lower() not in ("yes", "y"):
        raise ValueError(f"Tool invocations not approved for {agent}")
    feedback_entry = human_feedback_needed.pop(agent, None)
    if feedback_entry:
        feedback_entry["event"].set()

@app.post("/resolve_feedback")
async def resolve_feedback(request: HumanFeedbackRequest):
    agent = request.agent
    feedback = request.feedback
    try:
        resolve_human_feedback(agent, feedback)
        return {"message": f"Feedback resolved for {agent}"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

def time_tracker(func):
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        start_time = time.time()
        agent_name = kwargs.get("name")
        if agent_name:
            agent_start_times[agent_name] = start_time  # Store the start time of the agent
            agent_completed[agent_name] = False  # Mark the agent as not completed
        result = await func(*args, **kwargs)
        end_time = time.time()
        execution_time = end_time - start_time
        if agent_name:
            agent_times[agent_name] = agent_times.get(agent_name, [])
            agent_times[agent_name].append(execution_time)
            print(f"{agent_name} execution time: {execution_time:.2f} seconds")
            agent_completed[agent_name] = True  # Mark the agent as completed
        return result

    return wrapper


@time_tracker
async def agent_node(state, agent, name, ask_human_feedback=False):
    print(f"{name} is active")
    result = await agent.ainvoke(state)
    
    if ask_human_feedback:
        human_feedback_event = asyncio.Event()
        human_feedback_needed[name] = {
            "message": f"Do you approve of the following tool invocations for {name}?\n\n{result['output']}\n\n",
            "tool_invocations": result.get("tool_calls", []),
            "event": human_feedback_event
        }
        print(f"Waiting for human feedback for {name}")
        await human_feedback_event.wait()
    
    return {"messages": [HumanMessage(content=result["output"], name=name)]}

def create_team_supervisor(llm: ChatOpenAI, system_prompt, members) -> str:
    """An LLM-based router."""
    options = ["FINISH"] + members
    function_def = {
        "name": "route",
        "description": "Select the next role.",
        "parameters": {
            "title": "routeSchema",
            "type": "object",
            "properties": {
                "next": {
                    "title": "Next",
                    "anyOf": [
                        {"enum": options},
                    ],
                },
            },
            "required": ["next"],
        },
    }
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt),
            MessagesPlaceholder(variable_name="messages"),
            (
                "system",
                "Given the conversation above, who should act next?"
                " Or should we FINISH? Select one of: {options}",
            ),
        ]
    ).partial(options=str(options), team_members=", ".join(members))
    return (
        prompt
        | llm.bind_functions(functions=[function_def], function_call="route")
        | JsonOutputFunctionsParser()
    )

# Research team graph state
class ResearchTeamState(TypedDict):
    # A message is added after each team member finishes
    messages: Annotated[List[BaseMessage], operator.add]
    # The team members are tracked so they are aware of
    # the others' skill-sets
    team_members: List[str]
    # Used to route work. The supervisor calls a function
    # that will update this every time it makes a decision
    next: str


llm = ChatOpenAI(model="gpt-4-turbo")

search_agent = create_agent(
    llm,
    [tavily_tool],
    "You are a research assistant who can search for up-to-date info using the tavily search engine.",
)
def should_ask_feedback(prompt):
    keyword = "important"  # Change this to the desired keyword
    return keyword in prompt.lower()

async def conditional_search_node(state, agent, name):
    if should_ask_feedback(state["messages"][0].content):
        return await agent_node(state, agent, name, ask_human_feedback=True)
    else:
        return await agent_node(state, agent, name, ask_human_feedback=False)

search_node = functools.partial(conditional_search_node, agent=search_agent, name="Search")

# search_node = functools.partial(agent_node, agent=search_agent, name="Search", ask_human_feedback=True)

research_agent = create_agent(
    llm,
    [scrape_webpages],
    "You are a research assistant who can scrape specified urls for more detailed information using the scrape_webpages function.",
)
research_node = functools.partial(agent_node, agent=research_agent, name="WebScraper", ask_human_feedback=False)

supervisor_agent = create_team_supervisor(
    llm,
    "You are a supervisor tasked with managing a conversation between the"
    " following workers:  Search, WebScraper. Given the following user request,"
    " respond with the worker to act next. Each worker will perform a"
    " task and respond with their results and status. When finished,"
    " respond with FINISH.",
    ["Search", "WebScraper"],
)

research_graph = StateGraph(ResearchTeamState)
research_graph.add_node("Search", search_node)
research_graph.add_node("WebScraper", research_node)
research_graph.add_node("supervisor", supervisor_agent)

# Define the control flow
research_graph.add_edge("Search", "supervisor")
research_graph.add_edge("WebScraper", "supervisor")
research_graph.add_conditional_edges(
    "supervisor",
    lambda x: x["next"],
    {"Search": "Search", "WebScraper": "WebScraper", "FINISH": END},
)


research_graph.set_entry_point("supervisor")
chain = research_graph.compile()


# The following functions interoperate between the top level graph state
# and the state of the research sub-graph
# this makes it so that the states of each graph don't get intermixed
def enter_chain(message: str):
    results = {
        "messages": [HumanMessage(content=message)],
    }
    return results


research_chain = enter_chain | chain

async def stream_time_elapsed(prompt: str):
    global task_active, last_task_messages, agent_call_counts, agent_call_sequence
    task_active = True
    last_task_messages = []  # Reset the agent messages for the new task
    agent_call_counts = {}  # Reset the agent call counts for the new task
    agent_call_sequence = []  # Reset the agent call sequence for the new task

    start_time = time.time()

    async for s in research_chain.astream(prompt, {"recursion_limit": 100}):
        if "__end__" not in s:
            print(s)
            print("---")
            current_time = time.time()
            elapsed_time = current_time - start_time
            print(f"Total elapsed time: {elapsed_time:.2f} seconds")
            print()

            # Store the agent messages
            for key, value in s.items():
                if isinstance(value, dict) and "messages" in value:
                    for message in value["messages"]:
                        last_task_messages.append(TaskResult(agent=key, message=message.content))
                        agent_call_counts[key] = agent_call_counts.get(key, 0) + 1
                        print(agent_call_counts[key])
                        agent_call_sequence.append(key)

    end_time = time.time()
    execution_time = end_time - start_time

    print(f"Total execution time: {execution_time:.2f} seconds")
    print("Agent execution times:")
    total_agent_time = 0
    for agent, times in agent_times.items():
        total_time = sum(times)
        print(f"{agent}: {total_time:.2f} seconds (calls: {len(times)})")
        for i, time_taken in enumerate(times, start=1):
            print(f"  Call {i}: {time_taken:.2f} seconds")
        total_agent_time += total_time

    supervisor_time = execution_time - total_agent_time
    print(f"Supervisor: {supervisor_time:.2f} seconds")

    stop_event.set()  # Signal the print_elapsed_times coroutine to stop
    task_active = False

# @app.on_event("startup")
# async def startup_event():
#     asyncio.ensure_future(stream_time_elapsed())
#     with open('graph_structure.json', 'r') as file:
#         global data
#         data = json.load(file)

with open('cleaned_structure.json', 'r') as file:
    global data
    data = json.load(file)

@app.post("/run_agent_stream")
async def run_agent_stream(request: PromptRequest):
    with open('cleaned_structure.json', 'r') as file:
        global data
        data = json.load(file)
    prompt = request.prompt
    asyncio.ensure_future(stream_time_elapsed(prompt))
    return {"message": "Agent stream started"}

@app.get("/agent_status", response_model=AgentStatus)
async def get_agent_status():
    current_agent = ""
    elapsed_time = 0.0
    message = ""
    current_agent_call_count = 0
    prior_agents = []
    human_feedback_requested = False

    if not task_active:
        # Find the last completed agent
        for agent in reversed(agent_call_sequence):
            if agent_completed.get(agent, False):
                current_agent = agent
                elapsed_time = agent_times[agent][-1] if agent in agent_times else 0.0
                current_agent_call_count = agent_call_counts.get(current_agent, 0)
                break

        if not current_agent:
            message = "No task has been run yet. Please submit a POST request to /run_agent_stream to start a new task."
    else:
        current_time = time.time()
        for agent, start_time in agent_start_times.items():
            if not agent_completed.get(agent, True):  # Check if the agent has not completed
                current_agent = agent
                elapsed_time = current_time - start_time
                current_agent_call_count = agent_call_counts.get(current_agent, 0)
                updated_agent = update_elapsed_time(data, current_agent, elapsed_time)
                if updated_agent is None:
                    raise HTTPException(status_code=404, detail="Agent not found")
                
                # Update the number_calls payload for each agent
                for agent_data in data:
                    if agent_data['data']['label'] in agent_call_counts:
                        agent_data['data']['number_calls'] = agent_call_counts[agent_data['data']['label']]
                    else:
                        agent_data['data']['number_calls'] = 0
                
                break

    prior_agents = []
    for agent in agent_call_sequence:
        if agent != current_agent:
            prior_agents.append({
                "agent": agent,
                "call_count": agent_call_counts.get(agent, 0)
            })
        else:
            break
    
    # Check if any agent needs human feedback
    for agent in human_feedback_needed:
        if agent == current_agent:
            message = human_feedback_needed[agent]["message"]
            human_feedback_requested = True
            break

    return AgentStatus(current_agent=current_agent, elapsed_time=elapsed_time, task_active=task_active, message=message,
                       current_agent_call_count=current_agent_call_count, prior_agents=prior_agents, data=data,
                       human_feedback_requested=human_feedback_requested)

@app.get("/last_task_results", response_model=List[TaskResult])
async def get_last_task_results():
    return last_task_messages

import json
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
import requests

# app = FastAPI()

# @app.on_event("startup")
# def load_data():
#     # Load the data from the file at startup
#     with open('graph_structure.json', 'r') as file:
#         global data
#         data = json.load(file)

def reset_agents(agents):
    for agent in agents:
        agent['data']['timeElapsed'] = 0.0
        if agent['data']['num iters'] > 0:
            agent['data']['status'] = 'success'
        else:
            agent['data']['status'] = 'pending'
    return agents

def update_elapsed_time(agents, agent_label, new_elapsed_time):
    for agent in agents:
        if agent['data']['label'] == agent_label:
            agent['data']['timeElapsed'] = new_elapsed_time
            agent['data']['status'] = 'running'
            return agent  # Return the updated agent for confirmation
    return None

@app.get("/update_agent")
async def update_agent():
    try:
        # Call get_agent_status asynchronously and wait for its result
        status_data = await get_agent_status()
        current_agent = status_data.current_agent
        elapsed_time = status_data.elapsed_time
        
        # Update elapsed time
        updated_agent = update_elapsed_time(data, current_agent, elapsed_time)
        if updated_agent is None:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        # Optionally save the updated data to a file (or omit if not needed)
        with open('updated_agents.json', 'w') as file:
            json.dump(data, file)
        
        return JSONResponse(status_code=200, content=data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
