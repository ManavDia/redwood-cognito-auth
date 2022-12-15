import { useCallback, useState } from 'react'

import { Form, Submit, TextField as FormTextField } from '@redwoodjs/forms'
import { Link, navigate, routes } from '@redwoodjs/router'
import { MetaTags } from '@redwoodjs/web'

import { useAuth } from 'src/App'

const LoginPage = () => {
  const [passwordError, setPasswordError] = useState(null)
  const [loginCodeError, _setLoginCodeError] = useState(null)
  const [passwordChange, setPasswordChange] = useState<
    (_password: string) => void
  >(() => {})
  const { logIn, client, currentUser } = useAuth()
  const redirectPasswordResetRequest = (email) => {
    const tID = setTimeout(function () {
      window.clearTimeout(tID) // clear time out.
      navigate(
        routes.passwordResetRequest({ resetEmail: encodeURIComponent(email) })
      )
    }, 3000)
  }
  const onSubmitPassword = useCallback(
    async (data) => {
      const { email: tmpEmail, password, newPassword } = data
      const email = tmpEmail.toLowerCase()
      setPasswordError(null)

      let response
      try {
        if (passwordChange) {
          response = await passwordChange(newPassword)
        } else {
          response = await logIn({
            email: email,
            password: password,
          })
          setPasswordChange(() => response.newPasswordCallback)
        }
        if (response?.accessToken) {
          navigate(routes.protected())
        }
      } catch (error) {
        console.log({ error })
        if (error.message == 'Password reset required for the user') {
          setPasswordError(
            'Password reset required. Redirecting to reset page now...'
          )
          redirectPasswordResetRequest(email)
        } else {
          if (
            error.message.includes(
              'UserMigration failed with error User does not exist'
            )
          ) {
            setPasswordError('Incorrect username or password.')
          } else {
            setPasswordError(error.message)
          }
        }
      }
    },
    [passwordChange, logIn, client, currentUser]
  )
  return (
    <>
      <MetaTags title="Login" description="Login page" />

      <h1>LoginPage</h1>
      <p>
        Find me in <code>./web/src/pages/LoginPage/LoginPage.tsx</code>
      </p>
      <p>
        My default route is named <code>login</code>, link to me with `
        <Link to={routes.login()}>Login</Link>`
      </p>
      <div>
        <Form onSubmit={onSubmitPassword}>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <div className="mt-1">
              {' '}
              <FormTextField
                id="email"
                name="email"
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                label="Email"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <div className="mt-1">
            <FormTextField
              id="password"
              name="password"
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-expect-error
              type="password"
              autoComplete="current-password"
              disabled={!!passwordChange}
              required
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#038EFD] focus:border-[#038EFD] sm:text-sm"
            />
          </div>
          {passwordChange ? (
            <>
              <p className="my-1">
                You are required to change your password now
              </p>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700"
              >
                New Password:
              </label>
              <div className="mt-1">
                <FormTextField
                  id="newPassword"
                  name="newPassword"
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-expect-error
                  type="password"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#038EFD] focus:border-[#038EFD] sm:text-sm"
                />
              </div>
            </>
          ) : null}
          {passwordError && (
            <p id="login-error-message" className="text-sm text-gray-600">
              {passwordError}
            </p>
          )}
          {loginCodeError && (
            <p className="text-sm text-red-600">{loginCodeError}</p>
          )}
          <div className="flex items-center justify-end">
            <div className="text-xs">
              <a
                href="/app/password-reset-request"
                className="font-medium text-gray-500 hover:text-gray-400"
              >
                Forgot your password?
              </a>
            </div>
          </div>
          <Submit
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            type="submit"
            id="login-button"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#038EFD] hover:bg-[#0387f0] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Sign in
          </Submit>
        </Form>
      </div>
    </>
  )
}

export default LoginPage
