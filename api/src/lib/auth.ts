import { CurrentUserDecoded } from 'types/interfaces'

import { db } from './db'

export const isAuthenticated = () => {
  return !!context.currentUser
}

export const hasRole = ({ roles }) => {
  return roles !== undefined
}

export const requireAuth = ({ roles }) => {
  if (!isAuthenticated()) {
    throw new Error('You do not have permission to do that.')
  }
  return isAuthenticated()
}

/**
 * Here we would typically interact with the DB to verify the cognito user
 * and handle their roles and permissions. Typically this function can also cache
 * the current user for any queries that need to access the user's data, to prevent
 * unneccessary DB calls.
 * @param decoded
 * @param _rest
 * @returns
 */
export const getCurrentUser = async (
  decoded: CurrentUserDecoded | null,
  ..._rest: unknown[]
): Promise<CurrentUserDecoded> => {
  if (!decoded) {
    console.warn('No decoded token provided')
    return null
  }
  const dbUser = await db.user.findUnique({
    where: { username: decoded.sub },
  })

  if (!dbUser) {
    await db.user.create({
      data: {
        username: decoded.sub,
        lastLogin: new Date(),
      },
    })
  } else {
    await db.user.update({
      where: { username: decoded.sub },
      data: {
        lastLogin: new Date(),
      },
    })
  }
  return decoded
}
