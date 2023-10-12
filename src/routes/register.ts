import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { hash } from 'bcryptjs'
import 'dotenv/config'

export async function registerRoutes(app: FastifyInstance) {
  app.post('/register', async (request, reply) => {
    const paramsSchema = z.object({
      email: z.string(),
      password: z.string(),
      username: z.string(),
      farmSize: z.number(),
    })

    const { email, password, username, farmSize } = paramsSchema.parse(
      request.body,
    )

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return reply.status(409).send({ message: 'Usuário já cadastrado' })
    }

    const hashedPassword = await hash(password, 10)

    await prisma.user.create({
      data: { email, username, farmSize, password: hashedPassword },
    })

    return reply.status(200).send({ message: 'Usuário Registrado com sucesso' })
  })

  app.post('/newAnimal', async (request, reply) => {
    const paramsSchema = z.object({
      token: z.string(),
      nickname: z.string(),
      breed: z.string(),
      registerNumber: z.coerce.number(),
      gender: z.string(),
      birthDate: z.coerce.date(),
      animalClass: z.string(),
      breedFather: z.string(),
      breedMom: z.string(),
    })

    const {
      token,
      nickname,
      breed,
      registerNumber,
      gender,
      birthDate,
      animalClass,
      breedFather,
      breedMom,
    } = paramsSchema.parse(request.body)

    interface DecodePayloadType {
      sub: string
    }
    const decoded: DecodePayloadType | null = app.jwt.decode(token)

    if (!decoded) {
      return
    }

    const userId = decoded.sub

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
    })

    const existingCattle = await prisma.cattle.findFirst({
      where: { userId, nickname },
    })

    if (existingCattle) {
      console.log(
        'nao pode registrar outro animal',
        userId,
        nickname,
        existingCattle,
      )
      return reply
        .status(400)
        .send({ message: 'ja existe um animal registrado com esse nome' })
    }

    if (user) {
      await prisma.cattle.create({
        data: {
          userId,
          nickname,
          breed,
          registerNumber,
          gender,
          birthDate,
          animalClass,
          breedMom,
          breedFather,
        },
      })

      return reply
        .status(200)
        .send({ message: 'animal cadastrado com sucesso' })
    }
  })

  app.post('/production', async (request, reply) => {
    const paramsSchema = z.object({
      token: z.string(),
      nickname: z.string(),
      date: z.coerce.date(),
      milking: z.object({
        firstMilking: z.coerce.number(),
        secondMilking: z.coerce.number(),
        thirdMilking: z.coerce.number(),
      }),
    })

    const {
      token,
      nickname,
      date,
      milking: { firstMilking, secondMilking, thirdMilking },
    } = paramsSchema.parse(request.body)

    interface DecodePayloadType {
      sub: string
    }
    const decoded: DecodePayloadType | null = app.jwt.decode(token)

    if (!decoded) {
      return
    }

    const userId = decoded.sub

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
    })

    if (user) {
      if (firstMilking || secondMilking || thirdMilking) {
        const cattleId = await prisma.cattle.findFirst({
          where: { userId, nickname },
          select: { id: true },
        })

        if (!cattleId) {
          return reply
            .status(400)
            .send({ message: 'nao existe um animal com esse nome registado' })
        }

        const hasRecordForTheDay = await prisma.production.findFirst({
          where: { cattleId: cattleId.id, productionDate: date },
          select: {
            id: true,
            firstMilking: true,
            secondMilking: true,
            thirdMilking: true,
          },
        })

        if (hasRecordForTheDay) {
          const result = await prisma.production.update({
            where: { id: hasRecordForTheDay.id },
            data: {
              firstMilking:
                firstMilking !== 0
                  ? firstMilking
                  : hasRecordForTheDay.firstMilking,
              secondMilking:
                secondMilking !== 0
                  ? secondMilking
                  : hasRecordForTheDay.secondMilking,
              thirdMilking:
                thirdMilking !== 0
                  ? thirdMilking
                  : hasRecordForTheDay.thirdMilking,
            },
          })

          console.log('atualizado', result)
          return result
        } else {
          const result = await prisma.production.create({
            data: {
              cattleId: cattleId.id,
              productionDate: date,
              firstMilking,
              secondMilking,
              thirdMilking,
            },
          })

          console.log('registrado', result)
          return result
        }
      } else {
        return reply
          .status(400)
          .send({ message: 'é necessario informar pelo menos 1 colheita' })
      }
    }
  })

  app.post('/personalExpenses', async (request, reply) => {
    const paramsSchema = z.object({
      token: z.string(),
      nickname: z.string(),
      productName: z.string(),
      price: z.coerce.number(),
      date: z.coerce.date(),
    })

    const { token, nickname, productName, price, date } = paramsSchema.parse(
      request.body,
    )

    interface DecodePayloadType {
      sub: string
    }
    const decoded: DecodePayloadType | null = app.jwt.decode(token)

    if (!decoded) {
      return
    }

    const userId = decoded.sub

    await prisma.user.findUniqueOrThrow({
      where: { id: userId },
    })

    const cattleId = await prisma.cattle.findFirst({
      where: { userId, nickname },
      select: { id: true },
    })

    const id = cattleId ? cattleId.id : null

    if (!id) {
      return reply
        .status(400)
        .send({ message: 'não existe um animal com esse nome.' })
    }

    const result = await prisma.personalExpenses.create({
      data: {
        cattleId: id,
        nickname,
        productName,
        price,
        date,
      },
    })

    return result
  })

  app.post('/sharedExpenses', async (request) => {
    const paramsSchema = z.object({
      token: z.string(),
      category: z.string(),
      productName: z.string(),
      unitPrice: z.coerce.number(),
      measurementType: z.string(),
      quantity: z.coerce.number(),
      totalValue: z.coerce.number(),
      date: z.coerce.date(),
    })

    const {
      token,
      category,
      productName,
      unitPrice,
      measurementType,
      quantity,
      totalValue,
      date,
    } = paramsSchema.parse(request.body)

    interface DecodePayloadType {
      sub: string
    }
    const decoded: DecodePayloadType | null = app.jwt.decode(token)

    if (!decoded) {
      return
    }

    const userId = decoded.sub

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
    })

    console.log(user, userId)

    const result = await prisma.sharedExpenses.create({
      data: {
        userId,
        category,
        productName,
        unitPrice,
        measurementType,
        quantity,
        totalValue,
        date,
      },
    })

    return result
  })
}
