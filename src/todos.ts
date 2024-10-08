import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { Env } from './types'

const app = new Hono<{ Bindings: Env }>()

app.use('/todos/*', cors())

type Todo = {
  id: string
  title: string
  completed: boolean
  createdAt: string
  completedAt: string | null
  deleted: boolean // 新增字段
}

app.get('/', async (c) => {
  const { keys } = await c.env.TODOS.list()
  if (keys.length === 0) {
    return c.text('No todos found')
  }
  const randomKey = keys[Math.floor(Math.random() * keys.length)].name
  const todo = await c.env.TODOS.get(randomKey)
  return todo ? c.json(JSON.parse(todo)) : c.text('Todo not found')
})

app.get('/todos', async (c) => {
  const { keys } = await c.env.TODOS.list()
  const todos = await Promise.all(
    keys.map(async ({ name }) => {
      const todo = await c.env.TODOS.get(name)
      return todo ? JSON.parse(todo) : null
    })
  )
  const validTodos = todos.filter(Boolean)
  return c.json(validTodos)
})

app.post('/todos', async (c) => {
  const todoData = await c.req.json<Todo>()
  const todo: Todo = {
    ...todoData,
    createdAt: new Date().toISOString(),
    completedAt: null,
    deleted: false // 新增字段初始化
  }
  await c.env.TODOS.put(todo.id, JSON.stringify(todo))
  return c.json(todo)
})

app.get('/todos/:id', async (c) => {
  const todo = await c.env.TODOS.get<Todo>(c.req.param('id'))
  return todo ? c.json(todo) : c.notFound()
})

app.put('/todos/:id', async (c) => {
  const todoData = await c.req.json<Todo>()
  const existingTodo = await c.env.TODOS.get(c.req.param('id'))
  if (!existingTodo) return c.notFound()
  
  const parsedExistingTodo = JSON.parse(existingTodo) as Todo
  const updatedTodo: Todo = {
    ...parsedExistingTodo,
    ...todoData,
    completedAt: todoData.completed && !parsedExistingTodo.completed
      ? new Date().toISOString()
      : parsedExistingTodo.completedAt,
    deleted: parsedExistingTodo.deleted // 保留原有的 deleted 值
  }
  
  await c.env.TODOS.put(c.req.param('id'), JSON.stringify(updatedTodo))
  return c.json(updatedTodo)
})

app.delete('/todos/:id', async (c) => {
  await c.env.TODOS.delete(c.req.param('id'))
  return c.json({ message: 'Todo deleted' })
})

const seedData: Todo[] = [
  { id: '1', title: '买牛奶', completed: false, createdAt: '2024-03-10T08:00:00Z', completedAt: null, deleted: false },
  { id: '2', title: '写报告', completed: true, createdAt: '2024-03-09T14:30:00Z', completedAt: '2024-03-10T16:45:00Z', deleted: false },
  { id: '3', title: '打电话给妈妈', completed: false, createdAt: '2024-03-11T10:15:00Z', completedAt: null, deleted: false },
  { id: '4', title: '组织团队会议', completed: false, createdAt: '2024-03-12T09:00:00Z', completedAt: null, deleted: false },
  { id: '5', title: '去健身房锻炼', completed: true, createdAt: '2024-03-08T18:00:00Z', completedAt: '2024-03-09T20:30:00Z', deleted: false },
]

app.post('/todos/seed', async (c) => {
  const now = new Date().toISOString()
  await Promise.all(
    seedData.map(async (todoData) => {
      const todo: Todo = {
        ...todoData,
        createdAt: now,
        completedAt: todoData.completed ? now : null
      }
      await c.env.TODOS.put(todo.id, JSON.stringify(todo))
    })
  )
  
  return c.json({ message: '数据已插入' })
})

export default app