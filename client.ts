import axios from 'axios'

const BASE_URL = 'https://your-worker.your-domain.workers.dev/todos'

export type Todo = {
  id: string
  title: string
  completed: boolean
}

export async function listTodos(): Promise<Todo[]> {
  const res = await axios.get(BASE_URL)
  return res.data
}

export async function createTodo(todo: Omit<Todo, 'id'>): Promise<Todo> {
  const res = await axios.post(BASE_URL, todo)
  return res.data
}

export async function getTodo(id: string): Promise<Todo> {
  const res = await axios.get(`${BASE_URL}/${id}`)
  return res.data
}

export async function updateTodo(todo: Todo): Promise<Todo> {
  const res = await axios.put(`${BASE_URL}/${todo.id}`, todo)
  return res.data  
}

export async function deleteTodo(id: string): Promise<void> {
  await axios.delete(`${BASE_URL}/${id}`)
}