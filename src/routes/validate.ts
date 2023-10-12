import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'

export async function validateRoute(app: FastifyInstance) {
  app.post('/auth', async (request, reply) => {
    await request.jwtVerify()
    console.log(request.body)

    // const user = await prisma.user.findUnique({
    //   where: { email },
    // })

    // console.log(user)
  })
}
