import fastify from 'fastify'
import cors from '@fastify/cors'
import { registerRoutes } from './routes/register'
import jwt from '@fastify/jwt'
import 'dotenv/config'
import { loginRoutes } from './routes/login'
import { validateRoute } from './routes/validate'
import { searchRoutes } from './routes/search'

const app = fastify()

app.register(cors, {
  origin: true,
})

app.register(jwt, {
  secret: 'v8sApZIBqJR79n8G4zWWNsIcEBZggtStJlmgLl4AGqdtwvMMIL6zH6maNFXbZjYi',
})

app.register(validateRoute)
app.register(registerRoutes)
app.register(loginRoutes)
app.register(searchRoutes)

app
  .listen({
    port: 3333,
  })
  .then(() => {
    console.log('HTTP Server has been started.')
  })
