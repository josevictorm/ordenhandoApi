import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'

export async function searchRoutes(app: FastifyInstance) {
  app.get('/search', async (request) => {
    const authorization = request.headers.authorization

    if (!authorization) {
      return
    }

    const [, token] = authorization.split(' ')

    interface DecodePayloadType {
      sub: string
    }
    const decoded: DecodePayloadType | null = app.jwt.decode(token)

    if (!decoded) {
      return
    }

    const userId = decoded.sub

    const cattle = await prisma.cattle.findMany({
      where: {
        userId,
      },
      orderBy: {
        registerNumber: 'asc',
      },
      select: {
        id: true,
        nickname: true,
        registerNumber: true,
        animalClass: true,
      },
    })

    console.log(cattle)
    return cattle
  })

  app.get('/production', async (request) => {
    const authorization = request.headers.authorization

    if (!authorization) {
      return
    }

    const [, token] = authorization.split(' ')

    interface DecodePayloadType {
      sub: string
    }
    const decoded: DecodePayloadType | null = app.jwt.decode(token)

    if (!decoded) {
      return
    }

    const userId = decoded.sub

    const cattleInfo = await prisma.cattle.findMany({
      where: { userId },
      select: { id: true, nickname: true },
    })

    const userCattleId = cattleInfo.map((item) => item.id)

    const productionInfo = await prisma.production.findMany({
      where: {
        cattleId: {
          in: userCattleId,
        },
      },
      orderBy: {
        productionDate: 'desc',
      },
    })

    const result = productionInfo.map((info) => {
      const matchingNickname = cattleInfo.find((ci) => ci.id === info.cattleId)

      return {
        ...info,
        nickname: matchingNickname?.nickname,
      }
    })

    console.log(result)

    return result
  })
}
