import { Decoder } from '@redwoodjs/api'

import { logger as parentLogger } from '../logger'

import { cognito } from './cognitoDecoder'

const logger = parentLogger.child({ logSource: 'auth' })

const typesToDecoders = {
  cognito,
}

const decodeToken: Decoder = (token, type, req) => {
  try {
    if (!typesToDecoders[type]) {
      const message = `No decoder found for type: ${type}`
      logger.fatal(message)
      throw new Error(message)
    }
    const decoder = typesToDecoders[type]
    const decodedToken = decoder(token, req)
    return decodedToken
  } catch (err) {
    logger.error({ err })
    throw err
  }
}

export default decodeToken
