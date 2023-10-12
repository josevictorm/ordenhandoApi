import fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import 'dotenv/config'

const app = fastify()

app.register(cors, {
  origin: true,
})

app.register(jwt, {
  secret: 'v8sApZIBqJR79n8G4zWWNsIcEBZggtStJlmgLl4AGqdtwvMMIL6zH6maNFXbZjYi',
})

app.get('/', async () => {
  return 'app running'
})

app
  .listen({
    port: 5001,
  })
  .then(() => {
    console.log('HTTP Server has been started.')
  })
