import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { compareSync } from 'bcryptjs'

export async function loginRoutes(app: FastifyInstance) {
  app.get('/', async () => {
    return 'servidor funcionando milkwise'
  })

  app.post('/login', async (request, reply) => {
    const paramsSchema = z.object({
      email: z.string(),
      password: z.string(),
    })

    const { password, email } = paramsSchema.parse(request.body)

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return reply.status(401).send('Email não cadastrado')
    }

    const verifyPassword = compareSync(password, user.password)

    if (user && !verifyPassword) {
      return reply.status(401).send('Senha invalida')
    }

    if (user && verifyPassword) {
      const { username } = user

      const token = app.jwt.sign(
        { username },
        { sub: user.id, expiresIn: '1h' },
      )

      const sucess = {
        message: 'Usuario logado com sucesso',
        token,
      }

      return sucess
    }
  })
}
