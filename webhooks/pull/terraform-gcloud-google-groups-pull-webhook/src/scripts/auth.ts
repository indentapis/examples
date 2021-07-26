import { getAuth } from '../capabilities/google-groups'

getAuth()
  .then(() => {
    console.log('Confirmed token available.')
  })
  .catch((err) => {
    console.error(err)
  })
