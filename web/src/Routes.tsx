import { Route, Router, Set } from '@redwoodjs/router'

import HomePage from 'src/pages/HomePage/HomePage'
import LoginPage from 'src/pages/LoginPage/LoginPage'
import ProtectedPage from 'src/pages/ProtectedPage/ProtectedPage'

import { useAuth } from './App'
const Routes = () => {
  return (
    <Router useAuth={useAuth}>
      <Set private unauthenticated="login">
        <Route path="/protected" page={ProtectedPage} name="protected" />
      </Set>
      <Route path="/" page={HomePage} name="home" />
      <Route path="/login" page={LoginPage} name="login" />
      <Route notfound page={NotFoundPage} />
    </Router>
  )
}

export default Routes
